import crypto from "crypto";
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

export type BybitOrderSide = "Buy" | "Sell";
export type BybitOrderType = "Market" | "Limit";
export type BybitPositionIdx = 0 | 1 | 2; // 0: One-Way Mode, 1: Buy side hedge mode, 2: Sell side hedge mode

export interface BybitAccountInfo {
	list: Array<{
		accountType: string;
		totalEquity: string;
		totalWalletBalance: string;
		totalAvailableBalance: string;
		totalPerpUPL: string;
		totalInitialMargin: string;
		totalMaintenanceMargin: string;
		coin: Array<{
			coin: string;
			equity: string;
			usdValue: string;
			walletBalance: string;
			availableToWithdraw: string;
			borrowAmount: string;
			unrealisedPnl: string;
			cumRealisedPnl: string;
		}>;
	}>;
}

export interface BybitPlaceOrderParams {
	symbol: string;
	side: BybitOrderSide;
	orderType: BybitOrderType;
	qty: string;
	price?: string;
	leverage?: number;
	positionIdx?: BybitPositionIdx;
	timeInForce?: "GTC" | "IOC" | "FOK" | "PostOnly";
	reduceOnly?: boolean;
	closeOnTrigger?: boolean;
}

export interface BybitOrderResponse {
	orderId: string;
	orderLinkId: string;
}

export interface BybitPosition {
	list: Array<{
		symbol: string;
		side: string;
		size: string;
		positionValue: string;
		entryPrice: string;
		tradeMode: number;
		leverage: string;
		positionIdx: number;
		unrealisedPnl: string;
		cumRealisedPnl: string;
		markPrice: string;
		liqPrice: string;
		bustPrice: string;
	}>;
}

export interface BybitUserInfo {
	id: string;
	note: string;
	apiKey: string;
	readOnly: number;
	secret: string;
	permissions: {
		ContractTrade: string[];
		Spot: string[];
		Wallet: string[];
		Options: string[];
		Derivatives: string[];
		CopyTrading: string[];
		BlockTrade: string[];
		Exchange: string[];
		NFT: string[];
	};
	ips: string[];
	type: number;
	deadlineDay: number;
	expiredAt: string;
	createdAt: string;
	unified: number;
	uta: number;
	userID: number;
	inviterID: number;
	vipLevel: string;
	mktMakerLevel: string;
	affiliateID: number;
	rsaPublicKey: string;
	isMaster: boolean;
	parentUid: string;
	kycLevel: string;
	kycRegion: string;
}

export interface IOHLCData {
	symbol: string;
	open: string;
	high: string;
	low: string;
	close: string;
	openTime: number;
	closeTime: number;
	volume: string;
}

export interface IFetchBybitFuturesCandlesInput {
	pairs: string[];
	interval: string; // "1" | "3" | "5" | "15" | "30" | "60" | "120" | "240" | "D" | "W" | "M"
}

interface BybitKlineResponse {
	list: Array<
		[
			string, // start time
			string, // open
			string, // high
			string, // low
			string, // close
			string, // volume
			string // turnover
		]
	>;
}

interface IBybitFuturesClientConfig {
	apiKey: string;
	apiSecret: string;
	environment: "mainnet" | "demo" | "testnet"; // Changed from 'testnet' boolean
}

export class BybitFuturesClient {
	private readonly apiKey: string;
	private readonly apiSecret: string;
	private readonly baseUrl: string;
	private readonly client: AxiosInstance;
	private readonly recvWindow = 5000;

	constructor({ apiKey, apiSecret, environment }: IBybitFuturesClientConfig) {
		this.apiKey = apiKey;
		this.apiSecret = apiSecret;

		// Set the correct base URL based on environment
		if (environment === "demo") {
			this.baseUrl = "https://api-demo.bybit.com";
		} else if (environment === "testnet") {
			this.baseUrl = "https://api-testnet.bybit.com";
		} else {
			this.baseUrl = "https://api.bybit.com";
		}

		this.client = axios.create({
			baseURL: this.baseUrl,
			headers: {
				"Content-Type": "application/json",
			},
		});
	}

	/**
	 * Generate signature for authenticated requests
	 * Format: timestamp + apiKey + recvWindow + param_str
	 */
	private generateSignature(timestamp: number, paramStr: string): string {
		const message = timestamp + this.apiKey + this.recvWindow + paramStr;
		return crypto.createHmac("sha256", this.apiSecret).update(message).digest("hex");
	}

	/**
	 * Make authenticated request to Bybit API
	 */
	private async makeRequest<T>(
		method: "GET" | "POST",
		endpoint: string,
		params: Record<string, any> = {}
	): Promise<T> {
		const timestamp = Date.now();

		// For GET requests, use URLSearchParams; for POST, use JSON string
		let paramStr: string;
		let requestConfig: Partial<AxiosRequestConfig>;

		if (method === "GET") {
			// Sort parameters alphabetically for GET requests
			const sortedParams = Object.keys(params)
				.sort()
				.reduce<Record<string, any>>((acc, key) => {
					acc[key] = params[key];
					return acc;
				}, {});

			paramStr = new URLSearchParams(sortedParams).toString();
			requestConfig = {
				method,
				url: endpoint,
				params: sortedParams,
			};
		} else {
			// POST request - use JSON string
			paramStr = JSON.stringify(params);
			requestConfig = {
				method,
				url: endpoint,
				data: params,
			};
		}

		const signature = this.generateSignature(timestamp, paramStr);

		const headers = {
			"X-BAPI-API-KEY": this.apiKey,
			"X-BAPI-SIGN": signature,
			"X-BAPI-SIGN-TYPE": "2",
			"X-BAPI-TIMESTAMP": timestamp.toString(),
			"X-BAPI-RECV-WINDOW": this.recvWindow.toString(),
			"Content-Type": "application/json",
		};

		try {
			const response = await this.client.request({
				...requestConfig,
				headers,
			});

			if (response.data.retCode !== 0) {
				throw new Error(
					`Bybit API Error [${response.data.retCode}]: ${response.data.retMsg}`
				);
			}

			return response.data.result;
		} catch (error: any) {
			if (error.response) {
				throw new Error(`Bybit API Error: ${error.response.data?.retMsg || error.message}`);
			}
			throw new Error(`Bybit request failed: ${error.message}`);
		}
	}

	/**
	 * Get wallet balance for unified trading account
	 */
	async getAccountInfo(
		accountType: "UNIFIED" | "CONTRACT" = "UNIFIED"
	): Promise<BybitAccountInfo> {
		return this.makeRequest<BybitAccountInfo>("GET", "/v5/account/wallet-balance", {
			accountType,
		});
	}

	/**
	 * Get user information including userId
	 */
	async getUserInfo(): Promise<BybitUserInfo> {
		return this.makeRequest<BybitUserInfo>("GET", "/v5/user/query-api", {});
	}

	/**
	 * Set leverage for a symbol (unified account uses buy/sell leverage)
	 */
	async setLeverage(symbol: string, buyLeverage: string, sellLeverage: string): Promise<void> {
		await this.makeRequest("POST", "/v5/position/set-leverage", {
			category: "linear",
			symbol,
			buyLeverage,
			sellLeverage,
		});
	}

	/**
	 * Place a futures order
	 */
	async placeOrder(params: BybitPlaceOrderParams): Promise<BybitOrderResponse> {
		// Set leverage if provided
		if (params.leverage) {
			const leverage = params.leverage.toString();
			try {
				await this.setLeverage(params.symbol, leverage, leverage);
			} catch (error: any) {
				// Ignore if leverage is already set
				if (!error.message.includes("leverage not modified")) {
					throw error;
				}
			}
		}

		const orderParams: Record<string, any> = {
			category: "linear",
			symbol: params.symbol,
			side: params.side,
			orderType: params.orderType,
			qty: params.qty,
			positionIdx: params.positionIdx ?? 0,
		};

		// TimeInForce is required for all order types in V5
		if (params.orderType === "Market") {
			orderParams.timeInForce = "IOC"; // Immediate or Cancel for market orders
		} else {
			orderParams.timeInForce = params.timeInForce || "GTC"; // Good Till Cancel for limit orders
			if (params.price) {
				orderParams.price = params.price;
			}
		}

		// Add optional parameters
		if (params.reduceOnly !== undefined) {
			orderParams.reduceOnly = params.reduceOnly;
		}
		if (params.closeOnTrigger !== undefined) {
			orderParams.closeOnTrigger = params.closeOnTrigger;
		}

		return this.makeRequest<BybitOrderResponse>("POST", "/v5/order/create", orderParams);
	}

	/**
	 * Place a market order (convenience method)
	 */
	async placeMarketOrder({
		symbol,
		side,
		qty,
		leverage,
	}: {
		symbol: string;
		side: BybitOrderSide;
		qty: string;
		leverage?: number;
	}): Promise<BybitOrderResponse> {
		return this.placeOrder({ symbol, side, orderType: "Market", qty, leverage });
	}

	/**
	 * Place a limit order (convenience method)
	 */
	async placeLimitOrder({
		symbol,
		side,
		qty,
		price,
		leverage,
	}: {
		symbol: string;
		side: BybitOrderSide;
		qty: string;
		price: string;
		leverage?: number;
	}): Promise<BybitOrderResponse> {
		return this.placeOrder({ symbol, side, orderType: "Limit", qty, price, leverage });
	}

	/**
	 * Get all positions, open or pending
	 */
	async getPositions(symbol?: string): Promise<BybitPosition["list"]> {
		const params: Record<string, any> = {
			category: "linear",
			settleCoin: "USDT",
		};

		if (symbol) {
			params.symbol = symbol;
		}

		const positions = await this.makeRequest<BybitPosition>("GET", "/v5/position/list", params);
		return positions.list;
	}

	/**
	 * Get a position by symbol, open or pending
	 */
	async getPosition(symbol: string): Promise<BybitPosition["list"][0] | null> {
		const positions = await this.getPositions(symbol);
		if (positions && positions.length > 0) {
			return positions[0];
		}
		return null;
	}

	/**
	 * Get open positions, open positions are positions that have a size greater than 0
	 */
	async getOpenPositions(symbol?: string): Promise<BybitPosition["list"]> {
		const params: Record<string, any> = {
			category: "linear",
			settleCoin: "USDT",
		};

		if (symbol) {
			params.symbol = symbol;
		}

		const positions = await this.makeRequest<BybitPosition>("GET", "/v5/position/list", params);
		return positions.list.filter((pos) => parseFloat(pos.size) !== 0);
	}

	async getOpenPosition(symbol: string): Promise<BybitPosition["list"][0] | null> {
		const positions = await this.getOpenPositions(symbol);
		if (positions && positions.length > 0) {
			return positions[0];
		}
		return null;
	}

	/**
	 * Close a position
	 */
	async closePosition({
		symbol,
		side,
		qty,
	}: {
		symbol: string;
		side: BybitOrderSide;
		qty: string;
	}): Promise<BybitOrderResponse> {
		// To close a position, place an order in the opposite direction with reduceOnly
		const closeSide: BybitOrderSide = side === "Buy" ? "Sell" : "Buy";
		return this.placeOrder({
			symbol,
			side: closeSide,
			orderType: "Market",
			qty,
			reduceOnly: true,
		});
	}

	/**
	 * Place stop loss order after checking if main order is filled
	 */
	async placeStopLossOrder({
		symbol,
		mainOrderSide,
		stopLossPrice,
		quantity,
		positionIdx,
	}: {
		symbol: string;
		mainOrderSide: BybitOrderSide;
		stopLossPrice: string;
		quantity: string;
		positionIdx?: BybitPositionIdx;
	}): Promise<BybitOrderResponse> {
		try {
			// For stop loss, we place an order in the opposite direction
			const slSide: BybitOrderSide = mainOrderSide === "Buy" ? "Sell" : "Buy";

			return await this.placeOrder({
				symbol,
				side: slSide,
				orderType: "Market",
				qty: quantity,
				positionIdx: positionIdx ?? 0,
				reduceOnly: true,
				closeOnTrigger: true,
			});
		} catch (error: any) {
			throw new Error(`Failed to place stop loss order: ${error.message}`);
		}
	}

	/**
	 * Place take profit orders after main position is opened
	 */
	async placeTakeProfitOrders({
		symbol,
		mainOrderSide,
		targetProfits,
		positionIdx,
	}: {
		symbol: string;
		mainOrderSide: BybitOrderSide;
		targetProfits: Array<{ price: string; quantity: string }>;
		positionIdx?: BybitPositionIdx;
	}): Promise<BybitOrderResponse[]> {
		try {
			// For take profit, we place orders in the opposite direction
			const tpSide: BybitOrderSide = mainOrderSide === "Buy" ? "Sell" : "Buy";

			const tpOrderPromises = targetProfits.map(async (tp) => {
				return this.placeOrder({
					symbol,
					side: tpSide,
					orderType: "Limit",
					qty: tp.quantity,
					price: tp.price,
					positionIdx: positionIdx ?? 0,
					reduceOnly: true,
					timeInForce: "GTC",
				});
			});

			return await Promise.all(tpOrderPromises);
		} catch (error: any) {
			throw new Error(`Failed to place take profit orders: ${error.message}`);
		}
	}

	/**
	 * Set stop loss and take profit for an existing position
	 * This uses Bybit's position-level SL/TP feature
	 */
	async setPositionStopLossTakeProfit({
		symbol,
		stopLoss,
		takeProfit,
		positionIdx,
	}: {
		symbol: string;
		stopLoss?: string;
		takeProfit?: string;
		positionIdx?: BybitPositionIdx;
	}): Promise<void> {
		try {
			const params: Record<string, any> = {
				category: "linear",
				symbol,
				positionIdx: positionIdx ?? 0,
			};

			if (stopLoss) {
				params.stopLoss = stopLoss;
			}

			if (takeProfit) {
				params.takeProfit = takeProfit;
			}

			await this.makeRequest("POST", "/v5/position/trading-stop", params);
		} catch (error: any) {
			throw new Error(`Failed to set position SL/TP: ${error.message}`);
		}
	}

	/**
	 * Place a conditional order (stop order or take profit order with trigger)
	 * This is different from the above - it places a new order that triggers at a price
	 */
	async placeConditionalOrder({
		symbol,
		side,
		orderType,
		qty,
		price,
		triggerPrice,
		triggerBy = "LastPrice",
		positionIdx,
		reduceOnly,
	}: {
		symbol: string;
		side: BybitOrderSide;
		orderType: BybitOrderType;
		qty: string;
		price?: string;
		triggerPrice: string;
		triggerBy?: "LastPrice" | "IndexPrice" | "MarkPrice";
		positionIdx?: BybitPositionIdx;
		reduceOnly?: boolean;
	}): Promise<BybitOrderResponse> {
		try {
			const orderParams: Record<string, any> = {
				category: "linear",
				symbol,
				side,
				orderType,
				qty,
				triggerPrice,
				triggerBy,
				positionIdx: positionIdx ?? 0,
			};

			if (price) {
				orderParams.price = price;
			}

			if (orderType === "Market") {
				orderParams.timeInForce = "IOC";
			} else {
				orderParams.timeInForce = "GTC";
			}

			if (reduceOnly !== undefined) {
				orderParams.reduceOnly = reduceOnly;
			}

			return this.makeRequest<BybitOrderResponse>("POST", "/v5/order/create", orderParams);
		} catch (error: any) {
			throw new Error(`Failed to place conditional order: ${error.message}`);
		}
	}

	/**
	 * Fetch futures candles/klines for multiple pairs
	 * Public endpoint - no authentication required
	 */
	async fetchBybitFuturesCandles(input: IFetchBybitFuturesCandlesInput): Promise<IOHLCData[]> {
		try {
			// Fetch candles for all pairs in parallel
			const candlePromises = input.pairs.map(async (symbol) => {
				try {
					// Bybit kline endpoint is public, so we use axios directly without auth
					const response = await axios.get(`${this.baseUrl}/v5/market/kline`, {
						params: {
							category: "linear",
							symbol,
							interval: input.interval || "1", // Default to 1 minute
							limit: 1, // Get only the latest candle
						},
					});

					if (response.data.retCode !== 0) {
						throw new Error(
							`Bybit Kline API Error [${response.data.retCode}]: ${response.data.retMsg}`
						);
					}

					const klineData = response.data.result as BybitKlineResponse;

					if (!klineData.list || klineData.list.length === 0) {
						throw new Error(`No candle data found for ${symbol}`);
					}

					// Get the most recent candle
					const latestCandle = klineData.list[0];

					return {
						symbol,
						open: latestCandle[1],
						high: latestCandle[2],
						low: latestCandle[3],
						close: latestCandle[4],
						openTime: parseInt(latestCandle[0]),
						closeTime: parseInt(latestCandle[0]) + parseInt(input.interval) * 60 * 1000, // Approximate
						volume: latestCandle[5],
					};
				} catch (error: any) {
					console.error(`Error fetching candles for ${symbol}:`, error.message);
					throw error;
				}
			});

			const results = await Promise.all(candlePromises);
			return results;
		} catch (error: any) {
			throw new Error(`Failed to fetch Bybit futures candles: ${error.message}`);
		}
	}
}
