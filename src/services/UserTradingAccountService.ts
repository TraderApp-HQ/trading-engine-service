import { IUserTradingAccount } from "../models/UserTradingAccount";
import userTradingAccountRepository from "../repositories/UserTradingAccountRepo";

// Create a new trading account
export const createAccount = async (
	accountData: Partial<IUserTradingAccount>
): Promise<IUserTradingAccount> => {
	const account = await userTradingAccountRepository.add(accountData);
	if (!account) {
		throw new Error("Account creation failed"); // Throw an error if account is null
	}
	return account; // Return the account if it exists
};

// Delete a trading account by ID
export const deleteAccount = async (id: string): Promise<IUserTradingAccount | null> => {
	return await userTradingAccountRepository.deleteById(id);
};
