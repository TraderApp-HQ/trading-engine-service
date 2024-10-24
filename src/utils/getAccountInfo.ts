import axios from "axios";
import crypto from "crypto";
import { IUserTradingAccount } from "../models/UserTradingAccount";
import { decrypt } from "./encryption";

interface IGetBinanceAccountInfo {
	apiKey: string;
	apiSecret: string;
}

export async function getAccountInfo({
	apiKey,
	apiSecret,
}: IGetBinanceAccountInfo): Promise<Partial<IUserTradingAccount>> {
	const timestamp = Date.now();
	const recvWindow = 5000;

	const queryString = `timestamp=${timestamp}&recvWindow=${recvWindow}`;
	const signature = crypto
		.createHmac("sha256", decrypt(apiSecret))
		.update(queryString)
		.digest("hex");

	const headers = {
		"X-MBX-APIKEY": decrypt(apiKey),
	};

	// Define all endpoints to be called
	const endpoints = [
		`https://api.binance.com/sapi/v1/account/apiRestrictions?${queryString}&signature=${signature}`,
		`https://api.binance.com/api/v3/account?${queryString}&signature=${signature}`,
	];

	try {
		// fetch data from all endpoints concurrently
		const responses = await Promise.all(
			endpoints.map(async (url) => axios.get(url, { headers }))
		);

		const apiRestrictionsData = responses[0].data; // sapi/v1/account/apiRestrictions
		const accountData = responses[1].data; // api/v3/account

		const result: Partial<IUserTradingAccount> = {
			isFuturesTradingEnabled: apiRestrictionsData.enableFutures,
			isSpotTradingEnabled: apiRestrictionsData.enableSpotAndMarginTrading,
			isWithdrawalEnabled: apiRestrictionsData.enableWithdrawals,
			isIpWhitelistingEnabled: apiRestrictionsData.ipRestrict,
			accountUserId: accountData.uid,
		};
		console.log("Binance responses:", result);

		return result;
	} catch (error) {
		console.error("Error fetching account info:", error);
		throw error;
	}
}
