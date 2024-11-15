import { ErrorMessage } from "../config/constants";
import { IUpdateBalance } from "../config/interfaces";
import UserTradingBalance, { IUserTradingAccountBalance } from "../models/UserTradingBalance";

class UserTradingBalanceService {
	// Create a new trading account balance
	public async addAccountBalance(
		tradingBalanceData: Partial<IUserTradingAccountBalance>
	): Promise<IUserTradingAccountBalance> {
		const alreadyExistingExternalAccount = await UserTradingBalance.findOne({
			accountType: tradingBalanceData.accountType,
			userId: tradingBalanceData.userId,
			platformId: tradingBalanceData.platformId,
			currency: tradingBalanceData.currency,
		});

		if (alreadyExistingExternalAccount) {
			const res = this.updateBalance({
				id: alreadyExistingExternalAccount.id,
				tradingBalanceData,
			});
			return res;
		}

		const accountBalance = await UserTradingBalance.create(tradingBalanceData);
		if (!accountBalance) {
			const error = new Error("Account balance creation failed");
			error.name = ErrorMessage.notfound;
			throw error;
		}
		return accountBalance;
	}

	public async updateBalance(params: IUpdateBalance): Promise<IUserTradingAccountBalance> {
		const { id, tradingBalanceData } = params;
		const res = await UserTradingBalance.findByIdAndUpdate(id, {
			availableBalance: tradingBalanceData.availableBalance,
			lockedBalance: tradingBalanceData.lockedBalance,
		});
		return res as IUserTradingAccountBalance;
	}
}

export default UserTradingBalanceService;
