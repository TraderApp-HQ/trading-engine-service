import { ErrorMessage } from "../config/constants";
import UserTradingBalance, { IUserTradingAccountBalance } from "../models/UserTradingBalance";

class UserTradingBalanceService {
	// Create a new trading account balance
	public async addAccountBalance(
		tradingBalanceData: Partial<IUserTradingAccountBalance>
	): Promise<IUserTradingAccountBalance> {
		const accountBalance = await UserTradingBalance.create(tradingBalanceData);
		if (!accountBalance) {
			const error = new Error("Account balance creation failed");
			error.name = ErrorMessage.notfound;
			throw error;
		}
		return accountBalance;
	}
}

export default UserTradingBalanceService;
