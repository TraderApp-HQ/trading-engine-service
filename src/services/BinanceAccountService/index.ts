/* eslint-disable  @typescript-eslint/no-useless-constructor */
/* eslint-disable new-cap */
import crypto from "crypto";
import { AccountType, Category, Currency } from "../../config/enums";
import { BaseTradingAccount, ITradingAccountInput } from "../../factories/BaseTradingAccount";
import { ITradingAccountInfo } from "../../factories/interfaces";
import { ErrorMessage } from "../../config/constants";

export interface IBinanceSpotAccountInfo {
	uid: number;
	accountType: AccountType;
	balances: Array<{ asset: Currency; free: string; locked: string }>;
}

export interface IBinanceApiKeysPermissions {
	ipRestrict: boolean;
	createTime: number;
	enableReading: boolean;
	enableSpotAndMarginTrading: boolean;
	enableWithdrawals: boolean;
	enableInternalTransfer: boolean;
	enableMargin: boolean;
	enableFutures: boolean;
	permitsUniversalTransfer: boolean;
	enableVanillaOptions: boolean;
	enablePortfolioMarginTrading: boolean;
	enableFixApiTrade: boolean;
	enableFixReadOnly: boolean;
}

export interface IBinanceFuturesAccountBalances {
	accountAlias: string;
	asset: Currency;
	balance: string;
	crossWalletBalance: string;
	crossUnPnl: string;
	availableBalance: string;
	maxWithdrawAmount: string; // eg. "0.00000000";
	marginAvailable: boolean;
	updateTime: number;
}

class BinanceAccountService extends BaseTradingAccount {
	private readonly timestamp = Date.now();
	private readonly recvWindow = 5000;

	constructor(input: ITradingAccountInput) {
		super(input);
	}

	private generateSignature(queryString: string): string {
		return crypto
			.createHmac("sha256", this.apiSecret ?? "")
			.update(queryString)
			.digest("hex");
	}

	private getHeaders(): Record<string, string> {
		return { "X-MBX-APIKEY": this.apiKey ?? "" };
	}

	private async getTradingAccountInfoFromApis(): Promise<Partial<ITradingAccountInfo>> {
		const queryString = `timestamp=${this.timestamp}&recvWindow=${this.recvWindow}`;
		const signature = this.generateSignature(queryString);
		const headers = this.getHeaders();

		const endpoints = [
			`https://api.binance.com/sapi/v1/account/apiRestrictions?${queryString}&signature=${signature}`,
			`https://api.binance.com/api/v3/account?${queryString}&signature=${signature}`,
			`https://fapi.binance.com/fapi/v3/balance?${queryString}&signature=${signature}`,
		];

		try {
			const responses = await Promise.all(
				endpoints.map(async (url) => new this.apiClient(url).get({ options: { headers } }))
			);

			const apiRestrictionsData = responses[0] as IBinanceApiKeysPermissions;
			const spotAccountData = responses[1] as IBinanceSpotAccountInfo;
			const futuresAccountData = responses[2] as IBinanceFuturesAccountBalances[];

			const spotAccountBalances = spotAccountData.balances.filter(
				(x: { asset: string }) => x.asset === Currency.BTC || x.asset === Currency.USDT
			);

			const futuresAccountBalances = futuresAccountData.filter(
				(x: { asset: string }) => x.asset === Currency.BTC || x.asset === Currency.USDT
			);

			return {
				userId: this.userId,
				platformName: this.platformName,
				platformId: 270,
				apiKey: this.apiKey,
				apiSecret: this.apiSecret,
				accessToken: this.accessToken,
				refreshToken: this.refreshToken,
				category: Category.CRYPTO,
				connectionType: this.connectionType,
				isFuturesTradingEnabled: apiRestrictionsData.enableFutures,
				isSpotTradingEnabled: apiRestrictionsData.enableSpotAndMarginTrading,
				isWithdrawalEnabled: apiRestrictionsData.enableWithdrawals,
				isIpAddressWhitelisted: apiRestrictionsData.ipRestrict,
				externalAccountUserId: `${spotAccountData.uid}`,
				balances: [
					...spotAccountBalances.map((balance) => ({
						currency: balance.asset,
						accountType: AccountType.SPOT,
						availableBalance: Number(balance.free),
						lockedBalance: Number(balance.locked),
					})),
					...futuresAccountBalances.map((balance) => ({
						currency: balance.asset,
						accountType: AccountType.FUTURES,
						availableBalance: Number(balance.availableBalance),
						lockedBalance: Number(balance.balance) - Number(balance.availableBalance),
					})),
				],
			};
		} catch (error: any) {
			error.name = ErrorMessage.forbidden;
			error.message =
				error.response?.data.msg ??
				"Something went wrong trying to connect Binance account";
			throw error;
		}
	}

	public async processTradingAccountInfo() {
		const accountData = (await this.getTradingAccountInfoFromApis()) as ITradingAccountInfo;
		await this.tradingAccountRepo.processUserTradingAccountInfo(accountData);
	}

	public async deleteTradingAccount() {
		await this.tradingAccountRepo.archiveTradingAccount({
			userId: this.userId,
			platformName: this.platformName,
		});
	}
}

export default BinanceAccountService;
