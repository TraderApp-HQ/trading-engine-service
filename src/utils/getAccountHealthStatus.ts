import { IUserTradingAccount } from "../models/UserTradingAccount";

export async function getAccountHealthStatus(
	userTradingAccount: Partial<IUserTradingAccount>
): Promise<string[]> {
	const healthMessages = [];

	if (userTradingAccount.isWithdrawalEnabled) {
		healthMessages.push("Withdrawal is enabled");
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

	return healthMessages;
}
