import UserTradingAccount, { IUserTradingAccount } from "../models/UserTradingAccount";
import { updateAccountHealth } from "../utils/updateAccountHealth";

// Create a new trading account
export const createAccount = async (
	accountData: Partial<IUserTradingAccount>
): Promise<IUserTradingAccount> => {
	const account = await UserTradingAccount.create(accountData);
	if (!account) {
		throw new Error("Account creation failed"); // Throw an error if account is null
	}

	updateAccountHealth(account);
	return account; // Return the account if it exists
};

// Delete a trading account by ID
export const deleteAccount = async (id: string): Promise<IUserTradingAccount | null> => {
	return await UserTradingAccount.findByIdAndDelete(id);
};
