import { ErrorMessage } from "../config/constants";
import { AccountConnectionStatus } from "../config/enums";
import UserTradingAccount, { IUserTradingAccount } from "../models/UserTradingAccount";
import { getAccountHealthStatus } from "../utils/getAccountHealthStatus";

class UserTradingAccountService {
	// Create a new trading account
	public async connectAccount(
		accountData: Partial<IUserTradingAccount>
	): Promise<IUserTradingAccount> {
		const alreadyExistingAccount = await UserTradingAccount.findOne({
			userId: accountData.userId,
			platformId: accountData.platformId,
		});

		const alreadyExistingExternalAccount = await UserTradingAccount.findOne({
			externalAccountUserId: accountData.externalAccountUserId,
		});

		if (alreadyExistingAccount || alreadyExistingExternalAccount) {
			const error = new Error("Account Already Exist");
			error.name = ErrorMessage.forbidden;
			throw error;
		}

		const accountHealthMessages = await getAccountHealthStatus(accountData);
		if (accountHealthMessages.length > 0) {
			accountData.errorMessages = accountHealthMessages;
			accountData.connectionStatus = AccountConnectionStatus.FAILED;
		} else {
			accountData.connectionStatus = AccountConnectionStatus.CONNECTED;
		}

		const account = await UserTradingAccount.create(accountData);
		if (!account) {
			const error = new Error("Account creation failed");
			error.name = ErrorMessage.notfound;
			throw error; // Throw an error if account is null
		}

		return account;
	}

	// Delete a trading account by ID
	public async deleteAccount(id: string): Promise<IUserTradingAccount | null> {
		return await UserTradingAccount.findByIdAndUpdate(id, {
			connectionStatus: AccountConnectionStatus.ARCHIVED,
		});
	}
}

export default UserTradingAccountService;
