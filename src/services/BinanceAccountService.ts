import axios from "axios";
import crypto from "crypto";
import { decrypt } from "../utils/encryption";
import { AccountType, Currency } from "../config/enums";
import { ErrorMessage } from "../config/constants";

interface IGetBinanceAccountInfo {
	apiKey: string;
	apiSecret: string;
}

export interface IAccountBalance {
	asset: Currency;
	free: number;
	locked: number;
	accountType: AccountType;
}

interface IGetBinanceAccountInfoData {
	isFuturesTradingEnabled: boolean;
	isSpotTradingEnabled: boolean;
	isWithdrawalEnabled: boolean;
	isIpWhitelistingEnabled: boolean;
	externalAccountUserId: string;
	accountType: string;
	selectedBalances: IAccountBalance[];
}

class BinanceAccountService {
	private readonly apiKey: string;
	private readonly apiSecret: string;
	private readonly timestamp: number;
	private readonly recvWindow = 5000;

	constructor({ apiKey, apiSecret }: IGetBinanceAccountInfo) {
		this.apiKey = decrypt(apiKey);
		this.apiSecret = decrypt(apiSecret);
		this.timestamp = Date.now();
	}

	private generateSignature(queryString: string): string {
		return crypto.createHmac("sha256", this.apiSecret).update(queryString).digest("hex");
	}

	private getHeaders(): Record<string, string> {
		return { "X-MBX-APIKEY": this.apiKey };
	}

	public async getBinanceAccountInfo(): Promise<IGetBinanceAccountInfoData> {
		const queryString = `timestamp=${this.timestamp}&recvWindow=${this.recvWindow}`;
		const signature = this.generateSignature(queryString);
		const headers = this.getHeaders();

		const endpoints = [
			`https://api.binance.com/sapi/v1/account/apiRestrictions?${queryString}&signature=${signature}`,
			`https://api.binance.com/api/v3/account?${queryString}&signature=${signature}`,
		];

		try {
			const responses = await Promise.all(
				endpoints.map(async (url) => axios.get(url, { headers }))
			);

			const apiRestrictionsData = responses[0].data;
			const accountData = responses[1].data;

			const selectedBalances = accountData.balances.filter(
				(x: { asset: string }) => x.asset === "BTC" || x.asset === "USDT"
			);

			const result: IGetBinanceAccountInfoData = {
				isFuturesTradingEnabled: apiRestrictionsData.enableFutures,
				isSpotTradingEnabled: apiRestrictionsData.enableSpotAndMarginTrading,
				isWithdrawalEnabled: apiRestrictionsData.enableWithdrawals,
				isIpWhitelistingEnabled: apiRestrictionsData.ipRestrict,
				externalAccountUserId: accountData.uid,
				accountType: accountData.accountType,
				selectedBalances: selectedBalances.map((balance: IAccountBalance) => ({
					asset: balance.asset,
					free: balance.free,
					locked: balance.locked,
				})),
			};

			return result;
		} catch (error: any) {
			error.name = ErrorMessage.notfound;
			throw error;
		}
	}
}

export default BinanceAccountService;
