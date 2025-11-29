/* eslint-disable @typescript-eslint/consistent-type-definitions */
import Binance, { PositionSide, OrderSide } from "binance-api-node";
import type {
	FuturesOrder,
	MarketNewFuturesOrder,
	LimitNewFuturesOrder,
	StopNewFuturesOrder,
	StopMarketNewFuturesOrder,
	TakeProfitNewFuturesOrder,
	TakeProfitMarketNewFuturesOrder,
	QueryFuturesOrderResult,
	PositionRiskResult,
	CandleChartInterval_LT,
} from "binance-api-node";

type OrderType = "LIMIT" | "MARKET" | "STOP" | "STOP_MARKET" | "TAKE_PROFIT" | "TAKE_PROFIT_MARKET";

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

export interface IFetchBinanceFuturesCandlesInput {
	pairs: string[];
	interval: string;
}

export class BinanceFuturesClient {
	private readonly client: ReturnType<typeof Binance>;

	constructor(apiKey: string, apiSecret: string) {
		this.client = Binance({
			apiKey,
			apiSecret,
			httpFutures:
				process.env.NODE_ENV !== "production"
					? "https://testnet.binancefuture.com"
					: undefined,
		});
	}

	/**
	 * Place a new futures trade
	 */
	async placeTrade(params: {
		side: OrderSide;
		quantity: number;
		type: OrderType;
		symbol: string;
		price?: number;
		stopPrice?: number;
		positionSide?: PositionSide;
		leverage?: number;
		marginType?: "ISOLATED" | "CROSSED";
	}): Promise<FuturesOrder> {
		try {
			// Set leverage and marginType
			await Promise.all([
				this.setMarginType({
					symbol: params.symbol,
					marginType: params.marginType ?? "ISOLATED",
				}).catch((error) => {
					// Ignore error if margin type is already set to the desired value
					if (error.message.includes("No need to change margin type")) {
						return;
					}
					throw error;
				}),
				this.setLeverage({ symbol: params.symbol, leverage: params.leverage ?? 1 }),
			]);

			// Check for existing position
			// const existingPosition = await this.getOpenPosition({ symbol: params.symbol });
			// const positionAmount = existingPosition
			// 	? parseFloat(existingPosition.positionAmt as string)
			// 	: 0;

			// Determine if we're adding to or reducing the position
			// const isAddingToPosition =
			// 	existingPosition !== null &&
			// 	((positionAmount > 0 && params.side === "BUY") ||
			// 		(positionAmount < 0 && params.side === "SELL"));

			const baseOrder = {
				symbol: params.symbol,
				side: params.side,
				quantity: params.quantity.toString(),
				positionSide: params.positionSide || ("BOTH" as PositionSide),
				// reduceOnly: (isAddingToPosition ? "false" : "false") as "true" | "false",
			};

			let orderParams:
				| MarketNewFuturesOrder
				| LimitNewFuturesOrder
				| StopNewFuturesOrder
				| StopMarketNewFuturesOrder
				| TakeProfitNewFuturesOrder
				| TakeProfitMarketNewFuturesOrder;

			switch (params.type) {
				case "MARKET":
					orderParams = {
						...baseOrder,
						type: "MARKET",
					};
					break;
				case "LIMIT":
					if (!params.price) throw new Error("Price is required for LIMIT orders");
					orderParams = {
						...baseOrder,
						type: "LIMIT",
						price: params.price.toString(),
						timeInForce: "GTC", // Good Till Cancelled
					};
					break;
				// case "STOP":
				// 	if (!params.price || !params.stopPrice)
				// 		throw new Error("Price and stopPrice are required for STOP orders");
				// 	orderParams = {
				// 		...baseOrder,
				// 		type: "STOP",
				// 		price: params.price.toString(),
				// 		stopPrice: params.stopPrice.toString(),
				// 	};
				// 	break;
				// case "STOP_MARKET":
				// 	if (!params.stopPrice)
				// 		throw new Error("stopPrice is required for STOP_MARKET orders");
				// 	orderParams = {
				// 		...baseOrder,
				// 		type: "STOP_MARKET",
				// 		stopPrice: params.stopPrice.toString(),
				// 	};
				// 	break;
				// case "TAKE_PROFIT":
				// 	if (!params.price || !params.stopPrice)
				// 		throw new Error("Price and stopPrice are required for TAKE_PROFIT orders");
				// 	orderParams = {
				// 		...baseOrder,
				// 		type: "TAKE_PROFIT",
				// 		price: params.price.toString(),
				// 		stopPrice: params.stopPrice.toString(),
				// 	};
				// 	break;
				// case "TAKE_PROFIT_MARKET":
				// 	if (!params.stopPrice)
				// 		throw new Error("stopPrice is required for TAKE_PROFIT_MARKET orders");
				// 	orderParams = {
				// 		...baseOrder,
				// 		type: "TAKE_PROFIT_MARKET",
				// 		stopPrice: params.stopPrice.toString(),
				// 	};
				// 	break;
				default:
					// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
					throw new Error(`Unsupported order type: ${params.type}`);
			}

			// Place main order
			const mainOrder = await this.client.futuresOrder(orderParams);
			console.log("######### mainOrder placed ############", { mainOrder });

			return mainOrder;
		} catch (error: any) {
			throw new Error(`Failed to place trade: ${error.message}`);
		}
	}

	/**
	 * Place target profit orders after checking if main order is filled
	 */
	async placeTargetProfitOrders(params: {
		origClientOrderId: string;
		symbol: string;
		mainOrderSide: OrderSide;
		positionSide?: PositionSide;
		targetProfits: Array<{ price: number; percent: number }>;
	}): Promise<FuturesOrder[]> {
		try {
			// Check if main order is filled
			const mainOrder = await this.getTradeById({
				origClientOrderId: params.origClientOrderId,
				symbol: params.symbol,
			});

			if (mainOrder.status !== "FILLED") {
				throw new Error(`Main order is not filled yet. Status: ${mainOrder.status}`);
			}

			const executedQty = parseFloat(mainOrder.executedQty);
			console.log("######### Executed Qty for targets ############", { executedQty });

			if (executedQty <= 0) {
				throw new Error("No quantity was executed for the main order");
			}

			// Sort target profits by price based on side
			const sortedTargets =
				params.mainOrderSide === OrderSide.BUY
					? [...params.targetProfits].sort((a, b) => a.price - b.price) // ascending for BUY
					: [...params.targetProfits].sort((a, b) => b.price - a.price); // descending for SELL

			// Calculate quantities for each target
			let qtyLeft = executedQty;
			const tpOrderPromises: Array<Promise<FuturesOrder>> = [];

			for (let i = 0; i < sortedTargets.length; i++) {
				const tp = sortedTargets[i];
				let tpQty: number;

				if (i < sortedTargets.length - 1) {
					// For all but the last target, round down to 8 decimals
					tpQty = Math.floor(((executedQty * tp.percent) / 100) * 1e8) / 1e8;
					qtyLeft -= tpQty;
				} else {
					// Last target gets the remainder
					tpQty = Math.max(qtyLeft, 0);
				}

				if (tpQty <= 0) continue; // skip if nothing left

				console.log(`############## Target Profit Qty ${i + 1} ========== ${tpQty}`);
				const tpSide = params.mainOrderSide === OrderSide.BUY ? "SELL" : "BUY";

				tpOrderPromises.push(
					this.client.futuresOrder({
						symbol: params.symbol,
						side: tpSide as OrderSide,
						quantity: tpQty.toFixed(8),
						type: "TAKE_PROFIT_MARKET",
						stopPrice: tp.price.toString(),
						positionSide: params.positionSide || ("BOTH" as PositionSide),
						reduceOnly: "true",
					})
				);
			}

			return await Promise.all(tpOrderPromises);
		} catch (error: any) {
			throw new Error(`Failed to place target profit orders: ${error.message}`);
		}
	}

	/**
	 * Place stop loss order after checking if main order is filled
	 */
	async placeStopLossOrder(params: {
		origClientOrderId: string;
		symbol: string;
		mainOrderSide: OrderSide;
		positionSide?: PositionSide;
		stopLoss: { price: number };
	}): Promise<FuturesOrder> {
		try {
			// Check if main order is filled
			const mainOrder = await this.getTradeById({
				origClientOrderId: params.origClientOrderId,
				symbol: params.symbol,
			});

			if (mainOrder.status !== "FILLED") {
				throw new Error(`Main order is not filled yet. Status: ${mainOrder.status}`);
			}

			const executedQty = parseFloat(mainOrder.executedQty);
			console.log("######### Executed Qty for stop loss ############", { executedQty });

			if (executedQty <= 0) {
				throw new Error("No quantity was executed for the main order");
			}

			const slSide = params.mainOrderSide === OrderSide.BUY ? "SELL" : "BUY";

			return await this.client.futuresOrder({
				symbol: params.symbol,
				side: slSide as OrderSide,
				quantity: executedQty.toFixed(8),
				type: "STOP_MARKET",
				stopPrice: params.stopLoss.price.toString(),
				positionSide: params.positionSide || ("BOTH" as PositionSide),
				reduceOnly: "true",
			});
		} catch (error: any) {
			throw new Error(`Failed to place stop loss order: ${error.message}`);
		}
	}

	/**
	 * Get a specific trade by order ID for the current symbol
	 */
	async getTradeById({
		symbol,
		origClientOrderId,
	}: {
		origClientOrderId?: string;
		symbol: string;
	}): Promise<QueryFuturesOrderResult> {
		try {
			const order = await this.client.futuresGetOrder({
				symbol,
				origClientOrderId,
			});
			return order;
		} catch (error: any) {
			throw new Error(`Failed to get trade: ${error.message}`);
		}
	}

	/**
	 * Get the open position for the current symbol
	 */
	async getOpenPosition({ symbol }: { symbol: string }): Promise<PositionRiskResult | null> {
		try {
			const positions = await this.client.futuresPositionRisk({ symbol });
			const position = positions.find((pos) => parseFloat(pos.positionAmt) !== 0);
			return position || null;
		} catch (error: any) {
			throw new Error(`Failed to get open position: ${error.message}`);
		}
	}

	/**
	 * Close the open position for the current symbol
	 */
	async closeAllPositions({ symbol }: { symbol: string }): Promise<FuturesOrder[]> {
		try {
			const position = await this.getOpenPosition({ symbol });
			if (!position) return [];
			const side = (parseFloat(position.positionAmt) > 0 ? "SELL" : "BUY") as OrderSide;
			const order = await this.client.futuresOrder({
				symbol,
				side,
				quantity: Math.abs(parseFloat(position.positionAmt)).toString(),
				type: "MARKET",
				positionSide: position.positionSide as PositionSide,
			});
			return [order];
		} catch (error: any) {
			throw new Error(`Failed to close all positions: ${error.message}`);
		}
	}

	/**
	 * Set leverage for the symbol
	 */
	async setLeverage({ symbol, leverage }: { leverage: number; symbol: string }): Promise<void> {
		try {
			await this.client.futuresLeverage({
				symbol,
				leverage,
			});
		} catch (error: any) {
			throw new Error(`Failed to set leverage: ${error.message}`);
		}
	}

	/**
	 * Set margin type (ISOLATED or CROSSED)
	 */
	async setMarginType({
		symbol,
		marginType,
	}: {
		marginType: "ISOLATED" | "CROSSED";
		symbol: string;
	}): Promise<void> {
		try {
			await this.client.futuresMarginType({
				symbol,
				marginType,
			});
		} catch (error: any) {
			throw new Error(`Failed to set margin type: ${error.message}`);
		}
	}

	/**
	 * Get all historical trades for a specific symbol
	 */
	async getHistoricalTrades(symbol: string): Promise<QueryFuturesOrderResult> {
		try {
			const orders = await this.client.futuresAllOrders({
				symbol,
			});
			return orders;
		} catch (error: any) {
			throw new Error(`Failed to get historical trades: ${error.message}`);
		}
	}

	/**
	 * Get all open positions across all symbols
	 */
	async getAllOpenPositions(): Promise<PositionRiskResult[]> {
		try {
			const positions = await this.client.futuresPositionRisk();
			return positions.filter((pos) => parseFloat(pos.positionAmt) !== 0);
		} catch (error: any) {
			throw new Error(`Failed to get all open positions: ${error.message}`);
		}
	}

	/**
	 * Fetch futures candles/klines for multiple pairs
	 * Fetches last 5 1-minute candles, returns highest high and lowest low across all 5
	 * Open, close, openTime, closeTime, and volume are from the latest candle
	 */
	async fetchBinanceFuturesCandles(
		input: IFetchBinanceFuturesCandlesInput
	): Promise<IOHLCData[]> {
		try {
			// Fetch candles for all pairs in parallel
			const candlePromises = input.pairs.map(async (symbol) => {
				try {
					const candles = await this.client.futuresCandles({
						symbol,
						interval:
							(input.interval as CandleChartInterval_LT) ||
							("1m" as CandleChartInterval_LT),
						limit: 5, // Get only the latest candle
					});

					if (!candles || candles.length === 0) {
						throw new Error(`No candle data found for ${symbol}`);
					}

					// Get the most recent candle (last one)
					const latestCandle = candles[candles.length - 1];

					// Calculate highest high and lowest low across all 5 candles
					let highestHigh = parseFloat(candles[0].high);
					let lowestLow = parseFloat(candles[0].low);

					for (const candle of candles) {
						const high = parseFloat(candle.high);
						const low = parseFloat(candle.low);

						if (high > highestHigh) {
							highestHigh = high;
						}
						if (low < lowestLow) {
							lowestLow = low;
						}
					}

					return {
						symbol,
						open: latestCandle.open, // open from latest candle
						high: highestHigh.toString(), // highest high across all 5
						low: lowestLow.toString(), // lowest low across all 5
						close: latestCandle.close, // close from latest candle
						openTime: latestCandle.openTime, // open time from latest candle
						closeTime: latestCandle.closeTime, // close time from latest candle
						volume: latestCandle.volume, // volume from latest candle
					};
				} catch (error: any) {
					console.error(`Error fetching candles for ${symbol}:`, error.message);
					throw error;
				}
			});

			const results = await Promise.all(candlePromises);
			return results;
		} catch (error: any) {
			throw new Error(`Failed to fetch Binance futures candles: ${error.message}`);
		}
	}
}
