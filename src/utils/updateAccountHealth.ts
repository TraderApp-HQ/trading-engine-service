import { AccountConnectionStatus } from "../config/enums";
import { IUserTradingAccount } from "../models/UserTradingAccount";

export async function updateAccountHealth(userTradingAccount: IUserTradingAccount) {
	const healthMessages = [];

	if (!userTradingAccount.isWithdrawalEnabled) {
		healthMessages.push("Withdrawal is disabled");
	}

	if (!userTradingAccount.isFuturesTradingEnabled) {
		healthMessages.push("FUTURES trading is not enabled");
	}

	if (!userTradingAccount.isSpotTradingEnabled) {
		healthMessages.push("SPOT trading is not enabled");
	}

	if (!userTradingAccount.isIpWhitelistingEnabled) {
		healthMessages.push("IP whitelist does not match");
	}

	userTradingAccount.connectionStatus =
		healthMessages.length > 0
			? AccountConnectionStatus.FAILED
			: AccountConnectionStatus.CONNECTED;
	userTradingAccount.errorMessages = healthMessages;

	await userTradingAccount.save();
}
