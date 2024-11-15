import { ErrorMessage } from "../config/constants";
import { AccountConnectionStatus, AccountType, Currency } from "../config/enums";
import { IAccountBalance, IUpdateAccount, IUserAccountWithBalance } from "../config/interfaces";
import UserTradingAccount, { IUserTradingAccount } from "../models/UserTradingAccount";
import { decrypt, encrypt } from "../utils/encryption";
import { getAccountHealthStatus } from "../utils/getAccountHealthStatus";

class UserTradingAccountService {
	// Create a new trading account
	public async connectAccount(
		accountData: Partial<IUserTradingAccount>
	): Promise<IUserTradingAccount> {
		const alreadyExistingExternalAccount = await UserTradingAccount.findOne({
			externalAccountUserId: accountData.externalAccountUserId,
		});

		const existingExternalAccountForOtherUser = await UserTradingAccount.findOne({
			externalAccountUserId: accountData.externalAccountUserId,
			userId: { $ne: accountData.userId },
		});

		if (existingExternalAccountForOtherUser) {
			const error = new Error("Account already exist");
			error.name = ErrorMessage.validationError;
			throw error;
		}

		const accountHealthMessages = await getAccountHealthStatus(accountData);
		if (accountHealthMessages.length > 0) {
			accountData.errorMessages = accountHealthMessages;
			accountData.connectionStatus = AccountConnectionStatus.FAILED;
		} else {
			accountData.connectionStatus = AccountConnectionStatus.CONNECTED;
		}

		if (
			alreadyExistingExternalAccount &&
			alreadyExistingExternalAccount.connectionStatus !== AccountConnectionStatus.CONNECTED
		) {
			const account = await this.updateAccount({
				id: alreadyExistingExternalAccount.id,
				accountData,
			});
			return account;
		}

		if (alreadyExistingExternalAccount) {
			return alreadyExistingExternalAccount;
		}
		const account = await UserTradingAccount.create(accountData);
		if (!account) {
			const error = new Error("Account creation failed");
			error.name = ErrorMessage.notfound;
			throw error;
		}

		return account;
	}

	// Delete a trading account by ID
	public async deleteAccount(id: string): Promise<IUserTradingAccount | null> {
		return await UserTradingAccount.findByIdAndUpdate(id, {
			connectionStatus: AccountConnectionStatus.ARCHIVED,
		});
	}

	public async getUsersAccountsWithBalances(userId: string): Promise<IUserAccountWithBalance[]> {
		try {
			const accounts = await UserTradingAccount.find({
				userId,
				connectionStatus: { $ne: AccountConnectionStatus.ARCHIVED },
			}).populate<{
				balances: Array<Partial<IAccountBalance>>;
			}>({
				path: "balances",
				select: "currency availableBalance lockedBalance accountType", // Fields to populate
			});

			// Map each account to the IUserAccountWithBalance format
			return accounts.map((account) => ({
				id: account._id as string,
				platformName: account.platformName,
				platformId: account.platformId,
				plaformLogo: account.platformLogo,
				category: account.category,
				errorMessages: account.errorMessages,
				connectionStatus: account.connectionStatus,
				balances: account.balances.map((balance) => ({
					currency: balance.currency ?? Currency.USDT,
					availableBalance: balance.availableBalance ?? 0,
					lockedBalance: balance.lockedBalance ?? 0,
					accountType: balance.accountType ?? AccountType.SPOT,
				})),
			}));
		} catch (error: any) {
			error.name = ErrorMessage.notfound;
			throw error;
		}
	}

	public async updateAccount(params: IUpdateAccount): Promise<IUserTradingAccount> {
		const { id, accountData } = params;
		const accountHealthMessages = await getAccountHealthStatus(accountData);

		accountData.errorMessages = accountHealthMessages;
		accountData.apiKey = encrypt(accountData.apiKey ?? "");
		accountData.apiSecret = encrypt(accountData.apiSecret ?? "");

		const res = await UserTradingAccount.findByIdAndUpdate(id, accountData);
		return res as IUserTradingAccount;
	}

	public async getAccountById(_id: string): Promise<IUserTradingAccount> {
		const account = await UserTradingAccount.findOne({ _id });

		if (account && account?.apiKey && account?.apiSecret) {
			const apiKey = decrypt(account.apiKey);
			const apiSecret = decrypt(account.apiSecret);

			account.apiKey = apiKey;
			account.apiSecret = apiSecret;
		}
		return account as IUserTradingAccount;
	}
}

export default UserTradingAccountService;
