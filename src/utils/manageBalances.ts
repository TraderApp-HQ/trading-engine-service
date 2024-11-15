import { AccountType } from "../config/enums";
import { IUserTradingAccount } from "../models/UserTradingAccount";
import UserTradingBalanceService from "../services/UserTradingBalanceService";

// Utility function to create or update balances
export const manageBalances = async (
	accountService: UserTradingBalanceService,
	accountId: string,
	platformData: Partial<IUserTradingAccount>,
	binanceData: any
) => {
	const balanceIds = await Promise.all(
		binanceData.selectedBalances.map(async (balance: any) => {
			const createdBalance = await accountService.addAccountBalance({
				userId: accountId,
				platformName: platformData.platformName,
				platformId: platformData.platformId,
				currency: balance.asset,
				accountType: binanceData.accountType as AccountType,
				availableBalance: balance.free,
				lockedBalance: balance.locked,
			});
			return createdBalance._id;
		})
	);
	return balanceIds;
};
