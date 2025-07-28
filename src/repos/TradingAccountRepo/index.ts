import { ErrorMessage } from "../../config/constants";
import { TradingPlatforms } from "../../config/data";
import {
	AccountConnectionStatus,
	AccountType,
	Currency,
	TradingPlatform,
} from "../../config/enums";
import { IAddFund } from "../../config/interfaces";
import { ITradingAccountBalances, ITradingAccountInfo } from "../../factories/interfaces";
import UserTradingAccount, { IUserTradingAccount } from "../../models/UserTradingAccount";
import UserTradingAccountBalance, {
	IUserTradingAccountBalance,
} from "../../models/UserTradingAccountBalance";
import { decrypt, encrypt } from "../../utils/encryption";
import { FeatureFlagManager } from "../../utils/helpers/SplitIOClient";

export interface ITradingAccountsInput {
	userId: string;
}
export interface ITradingAccountInput {
	userId: string;
	platformName: TradingPlatform;
}

class TradingAccountRepository {
	public async processUserTradingAccountInfo(
		input: ITradingAccountInfo,
		{ isIpAddressWhitelistRequired }: { isIpAddressWhitelistRequired: boolean }
	) {
		const { userId } = input;
		const featureFlags = new FeatureFlagManager();
		const isDuplicateAccountAllowed = await featureFlags.checkToggleFlag(
			"release-referral-tracking",
			userId
		);

		// Ensures this only runs in production with the help of the feature flag
		// Allows for connection of same wallet to different users in development and staging but not in production
		if (!isDuplicateAccountAllowed) {
			// check if trading account has been connected before by a different user
			const isExternalAccountConnected = await UserTradingAccount.findOne({
				externalAccountUserId: input.externalAccountUserId,
				userId: { $ne: input.userId },
			});

			if (isExternalAccountConnected) {
				const error = new Error(
					"Sorry, this account has already been connected by a different user"
				);
				error.name = ErrorMessage.forbidden;
				throw error;
			}
		}

		// check if user has an existing, non-archived connection of the same trading account
		const tradingPlatformConnected = await UserTradingAccount.findOne({
			userId: input.userId,
			platformName: input.platformName,
			connectionStatus: { $ne: AccountConnectionStatus.ARCHIVED },
		});

		const errorMessages = this.performTradingAccountHealthCheck(
			input,
			isIpAddressWhitelistRequired
		);
		const accountData: ITradingAccountInfo = {
			...input,
			errorMessages,
			connectionStatus:
				errorMessages.length > 0
					? AccountConnectionStatus.FAILED
					: AccountConnectionStatus.CONNECTED,
		};

		// check if user is trying to connect new account while having an existing non-archived account of same platform
		if (
			tradingPlatformConnected &&
			tradingPlatformConnected.externalAccountUserId !== `${input.externalAccountUserId}`
		) {
			// archive the existing account or throw an error for user to disconnect existing account first
			await this.archiveTradingAccount({
				userId: input.userId,
				platformName: input.platformName,
			});
		}

		// save trading account info with balances
		await this.saveTradingAccountInfoWithBalances(accountData);
	}

	private performTradingAccountHealthCheck(
		input: ITradingAccountInfo,
		isIpAddressWhitelistRequired: boolean
	) {
		const errorMessages = [];

		if (input.isWithdrawalEnabled) {
			errorMessages.push("Withdrawal is enabled");
		}

		if (!input.isFuturesTradingEnabled) {
			errorMessages.push("FUTURES trading is not enabled");
		}

		if (!input.isSpotTradingEnabled) {
			errorMessages.push("SPOT trading is not enabled");
		}

		if (isIpAddressWhitelistRequired && !input.isIpAddressWhitelisted) {
			errorMessages.push("TraderApp IP addresses haven't been whitelisted");
		}

		const isFuturesTradingUSDTBalanceAboveFifty = input.balances.some(
			(balance) =>
				balance.accountType === AccountType.FUTURES &&
				balance.currency === Currency.USDT &&
				balance.availableBalance >= 50
		);
		if (!isFuturesTradingUSDTBalanceAboveFifty) {
			errorMessages.push("Futures trading USDT balance is less than 50 USDT");
		}

		return errorMessages;
	}

	private async saveTradingAccountInfoWithBalances(accountData: ITradingAccountInfo) {
		const tradingAccount = await UserTradingAccount.findOneAndUpdate(
			{
				userId: accountData.userId,
				platformName: accountData.platformName,
				externalAccountUserId: accountData.externalAccountUserId,
			},
			{
				$set: {
					...accountData,
					apiKey: accountData.apiKey ? encrypt(accountData.apiKey) : accountData.apiKey,
					apiSecret: accountData.apiSecret
						? encrypt(accountData.apiSecret)
						: accountData.apiSecret,
					passphrase: accountData.passphrase
						? encrypt(accountData.passphrase)
						: accountData.passphrase,
					balances: undefined,
				},
			},
			{
				upsert: true,
				new: true,
			}
		);

		if (!tradingAccount) throw Error("Trading account creation failed");
		const promises = accountData.balances.map((balance) =>
			UserTradingAccountBalance.findOneAndUpdate(
				{
					userId: accountData.userId,
					platformName: accountData.platformName,
					accountType: balance.accountType,
					currency: balance.currency,
				},
				{
					$set: {
						userId: accountData.userId,
						tradingAccountId: tradingAccount._id,
						platformName: accountData.platformName,
						platformId: accountData.platformId,
						currency: balance.currency,
						accountType: balance.accountType,
						availableBalance: balance.availableBalance,
						lockedBalance: balance.lockedBalance,
						accountSize: this.computeAccountSize(
							balance.availableBalance,
							balance.lockedBalance ?? 0
						),
					},
				},
				{
					upsert: true,
				}
			)
		);

		await Promise.all(promises);
	}

	public async archiveTradingAccount({ userId, platformName }: ITradingAccountInput) {
		const promises = [
			UserTradingAccount.findOneAndUpdate(
				{ userId, platformName },
				{
					$set: {
						connectionStatus: AccountConnectionStatus.ARCHIVED,
					},
				}
			),
			UserTradingAccountBalance.deleteMany({ userId, platformName }),
		];
		await Promise.all(promises);
	}

	public async getUserTradingAccountsWithBalancesFromDb({
		userId,
	}: ITradingAccountsInput): Promise<Partial<ITradingAccountInfo[]>> {
		// Fetch the trading account where userId match, and connectionStatus is not ARCHIVED
		const tradingAccounts = await UserTradingAccount.find({
			userId,
			connectionStatus: { $ne: AccountConnectionStatus.ARCHIVED },
		}).lean<IUserTradingAccount[]>();

		if (!tradingAccounts?.length) {
			return [];
		}

		// Fetch all balances associated with this trading account
		const balances = await UserTradingAccountBalance.find({
			userId,
		}).lean<IUserTradingAccountBalance[]>();

		const result: ITradingAccountInfo[] = tradingAccounts.map((tradingAccount) => ({
			accountId: (tradingAccount._id as string).toString(),
			userId: tradingAccount.userId,
			platformLogo:
				TradingPlatforms.find((tp) => tp.name === tradingAccount.platformName)?.logo ?? "",
			platformName: tradingAccount.platformName,
			platformId: tradingAccount.platformId,
			externalAccountUserId: tradingAccount.externalAccountUserId,
			isWithdrawalEnabled: tradingAccount.isWithdrawalEnabled,
			isFuturesTradingEnabled: tradingAccount.isFuturesTradingEnabled,
			isSpotTradingEnabled: tradingAccount.isSpotTradingEnabled,
			isIpAddressWhitelisted: tradingAccount.isIpAddressWhitelisted,
			connectionStatus: tradingAccount.connectionStatus,
			errorMessages: tradingAccount.errorMessages,
			category: tradingAccount.category,
			connectionType: tradingAccount.connectionType,
			balances: balances
				.filter(
					(balance) =>
						balance.tradingAccountId.toHexString() ===
						(tradingAccount._id as string).toString()
				)
				.map((balance) => ({
					currency: balance.currency,
					accountType: balance.accountType,
					availableBalance: balance.availableBalance,
					lockedBalance: balance.lockedBalance,
					accountSize: balance.accountSize,
				})),
		}));

		return result;
	}

	public async getUserTradingAccountWithBalancesFromDb({
		userId,
		platformName,
	}: ITradingAccountInput): Promise<Partial<ITradingAccountInfo>> {
		const tradingAccount = await this.getUserTradingAccount({ userId, platformName });

		// Fetch all balances associated with this trading account
		const balances = await UserTradingAccountBalance.find({
			userId,
			platformName,
			tradingAccountId: tradingAccount._id,
		}).lean<IUserTradingAccountBalance[]>();

		// Map the balances to the required format
		const formattedBalances: ITradingAccountBalances[] = balances.map((balance) => ({
			currency: balance.currency,
			accountType: balance.accountType,
			availableBalance: balance.availableBalance,
			lockedBalance: balance.lockedBalance,
			accountSize: balance.accountSize,
		}));

		// Construct the result object
		const result: Partial<ITradingAccountInfo> = {
			accountId: (tradingAccount._id as string).toString(),
			userId: tradingAccount.userId,
			platformLogo:
				TradingPlatforms.find((tp) => tp.name === tradingAccount.platformName)?.logo ?? "",
			platformName: tradingAccount.platformName,
			platformId: tradingAccount.platformId,
			externalAccountUserId: tradingAccount.externalAccountUserId,
			isWithdrawalEnabled: tradingAccount.isWithdrawalEnabled,
			isFuturesTradingEnabled: tradingAccount.isFuturesTradingEnabled,
			isSpotTradingEnabled: tradingAccount.isSpotTradingEnabled,
			isIpAddressWhitelisted: tradingAccount.isIpAddressWhitelisted,
			connectionStatus: tradingAccount.connectionStatus,
			errorMessages: tradingAccount.errorMessages,
			category: tradingAccount.category,
			connectionType: tradingAccount.connectionType,
			balances: formattedBalances,
		};

		return result;
	}

	public async getUserTradingAccount({
		userId,
		platformName,
	}: ITradingAccountInput): Promise<IUserTradingAccount> {
		const tradingAccount = await UserTradingAccount.findOne({
			userId,
			platformName,
			connectionStatus: { $ne: AccountConnectionStatus.ARCHIVED },
		}).lean<IUserTradingAccount>();

		if (!tradingAccount) {
			const error = new Error("Trading account does not exist");
			error.name = ErrorMessage.notfound;
			throw error;
		}

		tradingAccount.apiKey = tradingAccount.apiKey
			? decrypt(tradingAccount.apiKey)
			: tradingAccount.apiKey;
		tradingAccount.apiSecret = tradingAccount.apiSecret
			? decrypt(tradingAccount.apiSecret)
			: tradingAccount.apiSecret;
		tradingAccount.passphrase = tradingAccount.passphrase
			? decrypt(tradingAccount.passphrase)
			: tradingAccount.passphrase;

		return tradingAccount;
	}

	public async addFundToTradingAccount({
		userId,
		platformName,
		accountType,
		amount,
		currency,
	}: IAddFund): Promise<void> {
		try {
			// Increment the balance
			const updated = await UserTradingAccountBalance.findOneAndUpdate(
				{
					userId,
					platformName,
					accountType,
					currency,
				},
				{
					$inc: {
						availableBalance: amount,
					},
				},
				{ new: true }
			);

			// If it's a FUTURES account, check and clear the error message if needed
			if (accountType === AccountType.FUTURES && updated && updated.availableBalance >= 50) {
				await UserTradingAccount.findOneAndUpdate(
					{
						userId,
						platformName,
					},
					{
						$pull: {
							// Remove the specific error message from the errorMessages array
							errorMessages: "Futures trading USDT balance is less than 50 USDT",
						},
					}
				);
			}
		} catch (error) {
			throw new Error("Failed to add fund to trading account");
		}
	}

	public computeAccountSize(availableBalance: number, lockedBalance: number) {
		const totalBalance = availableBalance + (lockedBalance ?? 0);

		const tiers = [
			100, 200, 300, 500, 750, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 7500, 10000,
			12500, 15000, 20000, 25000, 30000, 40000, 50000, 60000, 75000, 100000, 125000, 150000,
			200000, 250000, 300000, 400000, 500000,
		];

		// Find the smallest tier that accommodates the balance
		const accountSize = tiers.find((tier) => totalBalance <= tier);

		// Default to 500000 for anything above the highest tier
		return accountSize || 500000;
	}
}

export default TradingAccountRepository;
