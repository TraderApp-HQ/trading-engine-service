import { runScript } from "../config";
import UserTradingAccount from "../../models/UserTradingAccount";
import { AccountConnectionStatus } from "../../config/enums";
import TradingAccountRepository from "../../repos/TradingAccountRepo";

runScript({
	scriptFunction: async () => {
		console.log("Disconnecting trading accounts");

		const tradingAccounts = await UserTradingAccount.find({
			connectionStatus: AccountConnectionStatus.CONNECTED,
		});

		const tradingRepo = new TradingAccountRepository();
		await Promise.all(
			tradingAccounts.map(async (tradingAccount) => {
				await tradingRepo.archiveTradingAccount({
					userId: tradingAccount.userId,
					platformName: tradingAccount.platformName,
				});
			})
		);

		console.log("Trading accounts archived successfully");
	},
});
