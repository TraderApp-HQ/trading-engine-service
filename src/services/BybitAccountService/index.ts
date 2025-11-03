/* eslint-disable  @typescript-eslint/no-useless-constructor */
/* eslint-disable new-cap */
import { AccountType, Category, Currency } from "../../config/enums";
import { BaseTradingAccount, ITradingAccountInput } from "../../factories/BaseTradingAccount";
import { ITradingAccountInfo } from "../../factories/interfaces";
import { ErrorMessage } from "../../config/constants";
import { FeatureFlagManager } from "../../clients/SplitIOClient";
import { BybitFuturesClient } from "../../clients/BybitFuturesClient";

class BybitAccountService extends BaseTradingAccount {
	private bybitClient: BybitFuturesClient;

	constructor(input: ITradingAccountInput) {
		super(input);

		// Initialize Bybit client based on environment
		this.bybitClient = new BybitFuturesClient({
			apiKey: this.apiKey || "",
			apiSecret: this.apiSecret || "",
			environment: "mainnet", // Default to mainnet, will be overridden in getTradingAccountInfoFromApis
		});
	}

	private async getTradingAccountInfoFromApis(): Promise<Partial<ITradingAccountInfo>> {
		const featureFlags = new FeatureFlagManager();
		const isTestModeEnabled = await featureFlags.checkToggleFlag(
			"release-bybit-account-test-mode",
			this.userId
		);

		// Reinitialize client with correct environment
		this.bybitClient = new BybitFuturesClient({
			apiKey: this.apiKey || "",
			apiSecret: this.apiSecret || "",
			environment: isTestModeEnabled ? "demo" : "mainnet",
		});

		// Add debugging logs
		console.log("Bybit API Request Debug:", {
			userId: this.userId,
			isTestModeEnabled,
			apiKeyPreview: this.apiKey ? this.apiKey.substring(0, 8) + "..." : "MISSING",
			hasApiSecret: !!this.apiSecret,
		});

		try {
			// Fetch user info and account info in parallel
			const [userInfo, accountInfo] = await Promise.all([
				this.bybitClient.getUserInfo(),
				this.bybitClient.getAccountInfo("UNIFIED"),
			]);

			// Log the responses for debugging
			console.log("Bybit User Info:", {
				userID: userInfo.userID,
				vipLevel: userInfo.vipLevel,
				kycLevel: userInfo.kycLevel,
			});
			console.log("Bybit Account Info:", JSON.stringify(accountInfo, null, 2));

			// Extract permissions from user info
			const hasContractTradePermission = userInfo.permissions.ContractTrade?.length > 0;
			const hasSpotPermission = userInfo.permissions.Spot?.length > 0;
			const hasWalletPermission = userInfo.permissions.Wallet?.length > 0;
			const hasWithdrawalPermission =
				hasWalletPermission && userInfo.permissions.Wallet.includes("AccountTransfer");

			// Check if IP restriction is enabled
			const isIpRestricted = !userInfo.ips?.includes("*");

			// Get the first account (should be UNIFIED)
			const account = accountInfo.list?.[0];
			if (!account) {
				throw new Error("No account data found in Bybit response");
			}

			// Filter for USDT balances (we can add more currencies later)
			const spotBalances = account.coin.filter((coin) => coin.coin === "USDT");
			const futuresBalances = account.coin.filter((coin) => coin.coin === "USDT");

			// Map to our balance format
			const balances = [
				// Spot balances
				...spotBalances.map((coin) => ({
					currency: coin.coin as Currency,
					accountType: AccountType.SPOT,
					availableBalance: parseFloat(coin.walletBalance),
					lockedBalance: 0, // Bybit unified account doesn't separate locked balance this way
				})),
				// Futures balances (using the same data since it's unified)
				...futuresBalances.map((coin) => ({
					currency: coin.coin as Currency,
					accountType: AccountType.FUTURES,
					availableBalance: parseFloat(coin.availableToWithdraw || coin.walletBalance),
					lockedBalance:
						parseFloat(coin.walletBalance) -
						parseFloat(coin.availableToWithdraw || coin.walletBalance),
				})),
			];

			const accountData = {
				userId: this.userId,
				platformName: this.platformName,
				platformId: 521, // Assign a unique platform ID for Bybit
				apiKey: this.apiKey,
				apiSecret: this.apiSecret,
				accessToken: this.accessToken,
				refreshToken: this.refreshToken,
				category: Category.CRYPTO,
				connectionType: this.connectionType,
				isFuturesTradingEnabled: hasContractTradePermission,
				isSpotTradingEnabled: hasSpotPermission,
				isWithdrawalEnabled: hasWithdrawalPermission,
				isIpAddressWhitelisted: isIpRestricted,
				externalAccountUserId: `${userInfo.userID}`,
				balances,
				isTestModeEnabled,
			};

			console.log("=================== accountData ======================", {
				accountData: {
					...accountData,
					apiKey: this.apiKey ? this.apiKey.substring(0, 8) + "..." : "MISSING",
					apiSecret: this.apiSecret ? this.apiSecret.substring(0, 8) + "..." : "MISSING",
					accessToken: this.accessToken
						? this.accessToken.substring(0, 8) + "..."
						: "MISSING",
					refreshToken: this.refreshToken
						? this.refreshToken.substring(0, 8) + "..."
						: "MISSING",
				},
			});

			return accountData;
		} catch (error: any) {
			console.error("Error fetching Bybit account info:", error);
			error.name = ErrorMessage.forbidden;
			error.message =
				error.response?.data?.retMsg ||
				error.message ||
				"Something went wrong trying to connect Bybit account";
			throw error;
		}
	}

	public async processTradingAccountInfo(): Promise<ITradingAccountInfo> {
		const accountData = (await this.getTradingAccountInfoFromApis()) as ITradingAccountInfo;
		await this.tradingAccountRepo.processUserTradingAccountInfo(accountData, {
			isIpAddressWhitelistRequired: true, // Bybit should have IP whitelisting
		});

		return accountData;
	}

	public async deleteTradingAccount() {
		await this.tradingAccountRepo.archiveTradingAccount({
			userId: this.userId,
			platformName: this.platformName,
		});
	}
}

export default BybitAccountService;
