/* eslint-disable  @typescript-eslint/no-useless-constructor */
/* eslint-disable new-cap */
import crypto from "crypto";
import { AccountType, Category, Currency } from "../../config/enums";
import { BaseTradingAccount, ITradingAccountInput } from "../../factories/BaseTradingAccount";
import { ITradingAccountInfo } from "../../factories/interfaces";
import { ErrorMessage } from "../../config/constants";

export interface IKucoinSpotBalance {
	id: string;
	currency: Currency;
	type: "trade" | "main";
	balance: string;
	available: string;
	holds: string;
}

export interface IKucoinFuturesBalance {
	accountEquity: number;
	unrealisedPNL: number;
	marginBalance: number;
	positionMargin: number;
	orderMargin: number;
	frozenFunds: number;
	availableBalance: number;
	currency: "XBT" | "USDT";
	riskRatio: number;
}

export interface IKucoinFuturesApiRes {
	code: string;
	data: IKucoinFuturesBalance;
}

export interface IKucoinSpotApiRes {
	code: string;
	data: IKucoinSpotBalance[];
}

export interface IKucoinOrdersApiRes {
	code: string;
	data?: { orderId: string };
	msg?: string;
}

class KucoinAccountService extends BaseTradingAccount {
	private readonly timestamp = Date.now();
	private readonly recvWindow = 5000;
	private readonly API_BASE_URL = "https://api.kucoin.com";
	private readonly FUTURES_API_BASE_URL = "https://api-futures.kucoin.com";

	constructor(input: ITradingAccountInput) {
		super(input);
	}

	generateHeaders = (endpoint: string, method: string) => {
		const timestamp = Date.now().toString();
		const signature = crypto
			.createHmac("sha256", this.apiSecret ?? "")
			.update(timestamp + method + endpoint)
			.digest("base64");

		const passphrase = crypto
			.createHmac("sha256", this.apiSecret ?? "")
			.update(this.passphrase ?? "")
			.digest("base64");

		return {
			"KC-API-KEY": this.apiKey,
			"KC-API-SIGN": signature,
			"KC-API-TIMESTAMP": timestamp,
			"KC-API-PASSPHRASE": passphrase,
			"KC-API-KEY-VERSION": "2",
		};
	};

	// Fetch spot balances
	private readonly getSpotBalances = async () => {
		const endpoint = "/api/v1/accounts?type=trade";
		const response: IKucoinSpotApiRes = await new this.apiClient(
			`${this.API_BASE_URL}${endpoint}`
		).get({
			options: { headers: this.generateHeaders(endpoint, "GET") },
		});
		return response.data.filter(
			(d) => d.currency === Currency.USDT || d.currency === Currency.BTC
		);
	};

	private readonly getFuturesBalances = async ({ currency }: { currency: "XBT" | "USDT" }) => {
		const endpoint = `/api/v1/account-overview?currency=${currency}`;
		const response: IKucoinFuturesApiRes = await new this.apiClient(
			`${this.FUTURES_API_BASE_URL}${endpoint}`
		).get({
			options: { headers: this.generateHeaders(endpoint, "GET") },
		});
		return response.data;
	};

	// this tries to place a spot trade order in order to check permissions
	private readonly checkSpotTradingPermissionEnabled = async () => {
		const endpoint = "/api/v1/orders";
		const url = this.API_BASE_URL + endpoint;

		// Unique identifier for the order
		const clientOid = crypto.randomUUID();

		// Order details
		const data = {
			clientOid,
			side: "buy",
			type: "market",
			symbol: "NONE",
			size: "0.001",
		};

		// Timestamp and signature
		const timestamp = Date.now().toString();
		const preHash = timestamp + "POST" + endpoint + JSON.stringify(data);
		const signature = crypto
			.createHmac("sha256", this.apiSecret ?? "")
			.update(preHash)
			.digest("base64");
		const headers = {
			"KC-API-KEY": this.apiKey,
			"KC-API-SIGN": signature,
			"KC-API-TIMESTAMP": timestamp,
			"KC-API-PASSPHRASE": this.passphrase,
			"Content-Type": "application/json",
		};

		try {
			await new this.apiClient(url).post({
				data,
				options: { headers },
			});
			return true;
		} catch (error: any) {
			if (error.response?.data?.code === "400007") return false;
			throw error;
		}
	};

	// this tries to place a futures trade order in order to check permissions
	private readonly checkFuturesTradingPermissionEnabled = async () => {
		const endpoint = "/api/v1/orders";
		const url = this.FUTURES_API_BASE_URL + endpoint;

		// Order details
		const data = {
			symbol: "NONE",
			side: "buy",
			type: "limit",
			size: 1,
			price: "2000",
			leverage: 5,
		};

		// Timestamp and signature
		const timestamp = Date.now().toString();
		const preHash = timestamp + "POST" + endpoint + JSON.stringify(data);
		const signature = crypto
			.createHmac("sha256", this.apiSecret ?? "")
			.update(preHash)
			.digest("base64");
		const headers = {
			"KC-API-KEY": this.apiKey,
			"KC-API-SIGN": signature,
			"KC-API-TIMESTAMP": timestamp,
			"KC-API-PASSPHRASE": this.passphrase,
			"Content-Type": "application/json",
		};

		try {
			await new this.apiClient(url).post({
				data,
				options: { headers },
			});
			return true;
		} catch (error: any) {
			if (error.response?.data?.code === "400007") return false;
			throw error;
		}
	};

	private async getTradingAccountInfoFromApis(): Promise<Partial<ITradingAccountInfo>> {
		try {
			const [
				spotAccountBalances,
				futuresAccountBalanceBTC,
				futuresAccountBalanceUSDT,
				isSpotTradingEnabled,
				isFuturesTradingEnabled,
			] = await Promise.all([
				this.getSpotBalances(),
				this.getFuturesBalances({ currency: "XBT" }),
				this.getFuturesBalances({ currency: "USDT" }),
				this.checkSpotTradingPermissionEnabled(),
				this.checkFuturesTradingPermissionEnabled(),
			]);

			return {
				userId: this.userId,
				platformName: this.platformName,
				platformId: 311,
				apiKey: this.apiKey,
				apiSecret: this.apiSecret,
				passphrase: this.passphrase,
				accessToken: this.accessToken,
				refreshToken: this.refreshToken,
				category: Category.CRYPTO,
				connectionType: this.connectionType,
				isFuturesTradingEnabled,
				isSpotTradingEnabled,
				isWithdrawalEnabled: false,
				isIpAddressWhitelisted: false,
				externalAccountUserId: spotAccountBalances[0].id,
				balances: [
					...spotAccountBalances.map((balance) => ({
						currency: balance.currency,
						accountType: AccountType.SPOT,
						availableBalance: parseFloat(balance.available),
						lockedBalance: parseFloat(balance.holds),
					})),
					{
						currency: Currency.BTC,
						accountType: AccountType.FUTURES,
						availableBalance: futuresAccountBalanceBTC.marginBalance,
						lockedBalance: futuresAccountBalanceBTC.frozenFunds,
					},
					{
						currency: Currency.USDT,
						accountType: AccountType.FUTURES,
						availableBalance: futuresAccountBalanceUSDT.marginBalance,
						lockedBalance: futuresAccountBalanceUSDT.frozenFunds,
					},
				],
			};
		} catch (error: any) {
			error.name = ErrorMessage.forbidden;
			error.message =
				error.response?.data.msg ?? "Something went wrong trying to connect Kucoin account";
			throw error;
		}
	}

	public async processTradingAccountInfo() {
		const accountData = (await this.getTradingAccountInfoFromApis()) as ITradingAccountInfo;
		await this.tradingAccountRepo.processUserTradingAccountInfo(accountData, {
			isIpAddressWhitelistRequired: false,
		});
	}

	public async deleteTradingAccount() {
		await this.tradingAccountRepo.archiveTradingAccount({
			userId: this.userId,
			platformName: this.platformName,
		});
	}
}

export default KucoinAccountService;
