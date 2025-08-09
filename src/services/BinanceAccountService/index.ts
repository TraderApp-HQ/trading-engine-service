/* eslint-disable  @typescript-eslint/no-useless-constructor */
/* eslint-disable new-cap */
import crypto from "crypto";
import { AccountType, Category, Currency } from "../../config/enums";
import { BaseTradingAccount, ITradingAccountInput } from "../../factories/BaseTradingAccount";
import { ITradingAccountInfo } from "../../factories/interfaces";
import { ErrorMessage } from "../../config/constants";
import { FeatureFlagManager } from "../../utils/helpers/SplitIOClient";

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
		const featureFlags = new FeatureFlagManager();
		const isTestModeEnabled = await featureFlags.checkToggleFlag(
			"release-binance-account-test-mode",
			this.userId
		);

		// Generate fresh timestamp for each request
		const timestamp = Date.now();
		const queryString = `timestamp=${timestamp}&recvWindow=${this.recvWindow}`;
		const signature = this.generateSignature(queryString);
		const headers = this.getHeaders();

		// Add debugging logs
		console.log("Binance API Request Debug:", {
			userId: this.userId,
			isTestModeEnabled,
			timestamp,
			apiKeyPreview: this.apiKey ? this.apiKey.substring(0, 8) + "..." : "MISSING",
			hasApiSecret: !!this.apiSecret,
		});

		const apiRestrictionsEndpoint = "https://api.binance.com";
		const spotEndpoint = "https://api.binance.com";
		const futuresEndpoint = isTestModeEnabled
			? "https://testnet.binancefuture.com"
			: "https://fapi.binance.com";

		// Only include futures endpoint in test mode
		const endpoints = isTestModeEnabled
			? [`${futuresEndpoint}/fapi/v3/balance?${queryString}&signature=${signature}`]
			: [
					`${apiRestrictionsEndpoint}/sapi/v1/account/apiRestrictions?${queryString}&signature=${signature}`,
					`${spotEndpoint}/api/v3/account?${queryString}&signature=${signature}`,
					`${futuresEndpoint}/fapi/v3/balance?${queryString}&signature=${signature}`,
			  ];

		let apiRestrictionsData: IBinanceApiKeysPermissions | null = null;
		let spotAccountData: IBinanceSpotAccountInfo | null = null;
		let futuresAccountData: IBinanceFuturesAccountBalances[] | null = [
			{
				asset: Currency.USDT,
				balance: "0.00000000",
				availableBalance: "0.00000000",
			},
			// {
			// 	asset: Currency.BTC,
			// 	balance: "0.00000000",
			// 	availableBalance: "0.00000000",
			// },
		] as IBinanceFuturesAccountBalances[];

		try {
			const responses = await Promise.allSettled(
				endpoints.map(async (url) => {
					try {
						return await new this.apiClient(url).get({ options: { headers } });
					} catch (error: any) {
						// Log detailed error information
						console.error("Detailed API Error:", {
							url,
							status: error.response?.status,
							statusText: error.response?.statusText,
							data: error.response?.data,
							headers: error.response?.headers,
							message: error.message,
						});
						throw error;
					}
				})
			);

			// Handle API restrictions data (skip in test mode)
			if (!isTestModeEnabled && responses[0].status === "fulfilled") {
				apiRestrictionsData = responses[0].value as IBinanceApiKeysPermissions;
			} else if (!isTestModeEnabled && responses[0].status === "rejected") {
				const error = new Error(`Failed to fetch API Restrictions: ${responses[0].reason}`);
				console.error("Error in fetching api restrictions", error);

				// Log the detailed error from the rejected promise
				if (responses[0].reason?.response) {
					console.error("Binance API Error Details:", {
						status: responses[0].reason.response.status,
						data: responses[0].reason.response.data,
						url: endpoints[0],
					});
				}

				throw responses[0].reason;
			}

			// Handle Spot account data (skip in test mode)
			if (!isTestModeEnabled && responses[1].status === "fulfilled") {
				spotAccountData = responses[1].value as IBinanceSpotAccountInfo;
			} else if (!isTestModeEnabled && responses[1].status === "rejected") {
				const error = new Error(
					`Failed to fetch Spot Account Data: ${responses[1].reason}`
				);
				console.error(error);
				throw responses[1].reason;
			}

			// Handle Futures account data
			const futuresResponseIndex = isTestModeEnabled ? 0 : 2;
			const futuresCallSucceeded = responses[futuresResponseIndex].status === "fulfilled";
			if (responses[futuresResponseIndex].status === "fulfilled") {
				futuresAccountData = (
					responses[futuresResponseIndex] as PromiseFulfilledResult<
						IBinanceFuturesAccountBalances[]
					>
				).value;
			} else {
				const error = new Error(
					`Failed to fetch Futures Account Data: ${
						(responses[futuresResponseIndex] as PromiseRejectedResult).reason
					}`
				);
				console.error(error);

				// throw error in test mode: meaning maybe live api keys are  being used who
				// plus we are only futures endpoint and fetching all user data (external userId) in test mode, so errors have to be caught and thrown
				if (isTestModeEnabled) {
					throw (responses[futuresResponseIndex] as PromiseRejectedResult).reason;
				}
			}

			const spotAccountBalances = isTestModeEnabled
				? [
						{
							asset: Currency.USDT,
							free: "0.00000000",
							locked: "0.00000000",
						},
						// {
						// 	asset: Currency.BTC,
						// 	free: "0.00000000",
						// 	locked: "0.00000000",
						// },
				  ]
				: spotAccountData?.balances.filter(
						(x: { asset: string }) => x.asset === Currency.USDT
				  ) || [];

			const futuresAccountBalances = futuresAccountData?.filter(
				(x: { asset: string }) => x.asset === Currency.USDT
			);

			const accountData = {
				userId: this.userId,
				platformName: this.platformName,
				platformId: 270,
				apiKey: this.apiKey,
				apiSecret: this.apiSecret,
				accessToken: this.accessToken,
				refreshToken: this.refreshToken,
				category: Category.CRYPTO,
				connectionType: this.connectionType,
				isFuturesTradingEnabled: futuresCallSucceeded
					? isTestModeEnabled
						? true
						: apiRestrictionsData?.enableFutures
					: false,
				isSpotTradingEnabled: isTestModeEnabled
					? true
					: apiRestrictionsData?.enableSpotAndMarginTrading,
				isWithdrawalEnabled: isTestModeEnabled
					? false
					: apiRestrictionsData?.enableWithdrawals,
				isIpAddressWhitelisted: isTestModeEnabled ? true : apiRestrictionsData?.ipRestrict,
				externalAccountUserId: isTestModeEnabled
					? `${futuresAccountData[0].accountAlias}`
					: `${spotAccountData?.uid ?? futuresAccountData[0].accountAlias}`,
				balances: [
					...spotAccountBalances.map((balance) => ({
						currency: balance.asset,
						accountType: AccountType.SPOT,
						availableBalance: parseFloat(balance.free),
						lockedBalance: parseFloat(balance.locked),
					})),
					...futuresAccountBalances.map((balance) => ({
						currency: balance.asset,
						accountType: AccountType.FUTURES,
						availableBalance: parseFloat(balance.availableBalance),
						lockedBalance:
							parseFloat(balance.balance) - parseFloat(balance.availableBalance),
					})),
				],
				isTestModeEnabled,
			};
			console.log("=================== accountData ======================", {
				accountData: {
					...accountData,
					apiKey: this.apiKey ? this.apiKey.substring(0, 8) + "..." : "MISSING",
					apiSecret: this.apiSecret ? this.apiSecret.substring(0, 8) + "..." : "MISSING",
					accessToken: this.accessToken
						? this.accessToken.substring(0, 8) + "..."
						: "MISSING",
					refreshToken: this.refreshToken
						? this.refreshToken.substring(0, 8) + "..."
						: "MISSING",
				},
			});
			return accountData;
		} catch (error: any) {
			error.name = ErrorMessage.forbidden;
			error.message =
				error.response?.data.msg ??
				"Something went wrong trying to connect Binance account";
			throw error;
		}
	}

	public async processTradingAccountInfo(): Promise<ITradingAccountInfo> {
		const accountData = (await this.getTradingAccountInfoFromApis()) as ITradingAccountInfo;
		await this.tradingAccountRepo.processUserTradingAccountInfo(accountData, {
			isIpAddressWhitelistRequired: true,
		});

		return accountData;
	}

	public async deleteTradingAccount() {
		await this.tradingAccountRepo.archiveTradingAccount({
			userId: this.userId,
			platformName: this.platformName,
		});
	}
}

export default BinanceAccountService;
