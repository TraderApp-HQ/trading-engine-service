import { TradeStatus, TradeSide } from "../../config/enums";
import { ICreateMasterTrade, IMasterTrade, MasterTrade } from "../../models/MasterTrade";
import { IOHLCData } from "../../clients/BinanceFuturesClient";
import { IProcessUserTradingWithMasterTradeEvent } from "../../config/interfaces";
import { publishMessageToQueue } from "../../clients/SQSClient/helpers";

export class TradeService {
	public async getActiveMasterTrades(): Promise<IMasterTrade[]> {
		return MasterTrade.find({
			status: {
				$in: [TradeStatus.ACTIVE, TradeStatus.PENDING, TradeStatus.PROCESSED],
			},
		}).sort({ createdAt: -1 });
	}

	public async createTrade(newTrade: ICreateMasterTrade): Promise<IMasterTrade | null> {
		try {
			const createdTrade = await MasterTrade.create(newTrade);
			return createdTrade;
		} catch (error: unknown) {
			if (error instanceof Error) {
				throw new Error(error.message);
			}
			throw new Error("An unknown error occurred while creating trade.");
		}
	}

	/**
	 * Process master trades based on Binance futures candles data
	 * - For ACTIVE trades: Updates PNL based on current closing price
	 * - For PENDING trades: Checks if trigger price is reached and activates trade
	 */
	public async processMasterTradesWithCandles(
		ohlcData: IOHLCData[],
		trades: IMasterTrade[]
	): Promise<void> {
		try {
			// Create a map for quick lookup
			const ohlcMap = new Map<string, IOHLCData>();
			ohlcData.forEach((data) => {
				ohlcMap.set(data.symbol, data);
			});

			// Process each trade
			const updatePromises = trades.map(async (trade) => {
				const candle = ohlcMap.get(trade.pair);
				if (!candle) {
					console.warn(`No candle data found for pair: ${trade.pair}`);
					return;
				}

				if (trade.status === TradeStatus.ACTIVE) {
					return this.processActiveTrade(trade, candle);
				} else if (trade.status === TradeStatus.PROCESSED) {
					return this.processProcessedTrade(trade, candle);
				} else if (trade.status === TradeStatus.PENDING) {
					return this.processPendingTrade(trade, candle);
				}
			});

			await Promise.all(updatePromises);
			console.log(`Successfully processed ${trades.length} trades`);
		} catch (error: unknown) {
			if (error instanceof Error) {
				throw new Error(`Failed to process master trades: ${error.message}`);
			}
			throw new Error("An unknown error occurred while processing master trades.");
		}
	}

	/**
	 * Process ACTIVE trade - update PNL and current price
	 */
	private async processActiveTrade(trade: IMasterTrade, candle: IOHLCData): Promise<void> {
		const closePrice = parseFloat(candle.close);
		let pnl: number;
		let pnlPercentage: number;

		// Calculate PNL percentage and amount based on trade side
		if (trade.side === TradeSide.LONG) {
			// Calculate PNL percentage
			pnlPercentage = ((closePrice - trade.entryPrice) / trade.entryPrice) * 100;

			// Calculate PNL amount based on the pnl percentage of trade.quoteTotal
			pnl = (trade.quoteTotal * pnlPercentage) / 100;
		} else {
			// Calculate PNL percentage
			pnlPercentage = ((trade.entryPrice - closePrice) / trade.entryPrice) * 100;

			// Calculate PNL amount based on the pnl percentage of trade.quoteTotal
			pnl = (trade.quoteTotal * pnlPercentage) / 100;
		}

		// Update trade in database
		await MasterTrade.updateOne(
			{ _id: trade._id },
			{
				$set: {
					currentPrice: closePrice,
					pnl,
					pnlPercentage,
					updatedAt: new Date(),
				},
			}
		);

		console.log(
			`Updated ACTIVE trade ${trade.pair} - Price: ${closePrice}, PNL: ${pnl.toFixed(
				2
			)} (${pnlPercentage.toFixed(2)}%)`
		);
	}

	/**
	 * Process PROCESSED trade - check if entry price is reached
	 */
	private async processProcessedTrade(trade: IMasterTrade, candle: IOHLCData): Promise<void> {
		const highPrice = parseFloat(candle.high);
		const lowPrice = parseFloat(candle.low);
		let triggerReached = false;

		// Check if trigger price is reached based on trade side
		if (trade.side === TradeSide.LONG) {
			// For LONG trades, check if HIGH price reached or exceeded trigger
			triggerReached = lowPrice <= trade.entryPrice;
		} else {
			// For SHORT trades, check if LOW price reached or went below trigger
			triggerReached = highPrice >= trade.entryPrice;
		}

		if (triggerReached) {
			try {
				const currentPrice = parseFloat(candle.close);
				// const processUserTradingWithMasterTradeEvent: IProcessUserTradingWithMasterTradeEvent =
				// 	{
				// 		masterTradeId: trade.id,
				// 		stopLossPrice: trade.stopLossPrice,
				// 		takeProfitPrice: trade.takeProfitPrice,
				// 		entryPrice: trade.entryPrice,
				// 		baseAsset: trade.baseAsset,
				// 		quoteCurrency: trade.quoteCurrency,
				// 		pair: trade.pair,
				// 		supportedTradingPlatforms: trade.supportedTradingPlatforms,
				// 		tradeSide: trade.side,
				// 		targetOrdersAmountToFill: trade.targetOrdersAmountToFill,
				// 		orderPlacementType: trade.orderPlacementType,
				// 		accountType: trade.accountType,
				// 	};

				// Publish master trade to queue and update trade status to ACTIVE
				await Promise.all([
					// publishMessageToQueue({
					// 	queueUrl: process.env.PROCESS_INCOMING_MASTER_TRADES_QUEUE ?? "",
					// 	message: JSON.stringify(processUserTradingWithMasterTradeEvent),
					// }),
					MasterTrade.updateOne(
						{ _id: trade._id },
						{
							$set: {
								status: TradeStatus.ACTIVE,
								currentPrice,
								pnl: 0,
								pnlPercentage: 0,
							},
						}
					),
				]);

				console.log(
					`✅ PROCESSED trade ${trade.pair} ACTIVATED - Trigger and published to queue: ${
						trade.ordersTriggerPrice
					}, ${trade.side === TradeSide.LONG ? "Low" : "High"}: ${
						trade.side === TradeSide.LONG ? lowPrice : highPrice
					}`
				);
			} catch (error) {
				console.log(
					"=================== Error occurred while processing pending trade ======================",
					error
				);
				throw error;
			}
		}
	}

	/**
	 * Process PENDING trade - check if trigger price is reached
	 */
	private async processPendingTrade(trade: IMasterTrade, candle: IOHLCData): Promise<void> {
		const highPrice = parseFloat(candle.high);
		const lowPrice = parseFloat(candle.low);
		let triggerReached = false;

		// Check if trigger price is reached based on trade side
		if (trade.side === TradeSide.LONG) {
			// For LONG trades, check if HIGH price reached or exceeded trigger
			triggerReached = lowPrice <= trade.ordersTriggerPrice;
		} else {
			// For SHORT trades, check if LOW price reached or went below trigger
			triggerReached = highPrice >= trade.ordersTriggerPrice;
		}

		if (triggerReached) {
			try {
				const currentPrice = parseFloat(candle.close);
				const processUserTradingWithMasterTradeEvent: IProcessUserTradingWithMasterTradeEvent =
					{
						masterTradeId: trade.id,
						stopLossPrice: trade.stopLossPrice,
						takeProfitPrice: trade.takeProfitPrice ?? 0,
						entryPrice: trade.entryPrice,
						baseAsset: trade.baseAsset,
						quoteCurrency: trade.quoteCurrency,
						pair: trade.pair,
						supportedTradingPlatforms: trade.supportedTradingPlatforms,
						tradeSide: trade.side,
						targetOrdersAmountToFill: trade.targetOrdersAmountToFill,
						orderPlacementType: trade.orderPlacementType,
						accountType: trade.accountType,
					};

				// Publish master trade to queue and update trade status to ACTIVE
				await Promise.all([
					publishMessageToQueue({
						queueUrl: process.env.PROCESS_INCOMING_MASTER_TRADES_QUEUE ?? "",
						message: JSON.stringify(processUserTradingWithMasterTradeEvent),
					}),
					MasterTrade.updateOne(
						{ _id: trade._id },
						{
							$set: {
								status: TradeStatus.PROCESSED,
								currentPrice,
								pnl: 0,
								pnlPercentage: 0,
							},
						}
					),
				]);

				console.log(
					`✅ PENDING trade ${trade.pair} PROCESSED - Trigger and published to queue: ${
						trade.ordersTriggerPrice
					}, ${trade.side === TradeSide.LONG ? "Low" : "High"}: ${
						trade.side === TradeSide.LONG ? lowPrice : highPrice
					}`
				);
			} catch (error) {
				console.log(
					"=================== Error occurred while processing pending trade ======================",
					error
				);
				throw error;
			}
		}
	}
}
