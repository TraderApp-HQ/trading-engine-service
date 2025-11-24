import mongoose from "mongoose";
import { IOHLCData } from "../../clients/BinanceFuturesClient";
import { publishMessageToQueue } from "../../clients/SQSClient/helpers";
import { ErrorName, OrderType, TradeSide, TradeStatus, TradingPlatform } from "../../config/enums";
import { ApplicationError } from "../../config/helpers";
import {
	ICloseTradeEvent,
	IProcessUserTradingWithMasterTradeEvent,
	ITradeAggregate,
} from "../../config/interfaces";
import { ICreateMasterTrade, IMasterTrade, MasterTrade } from "../../models/MasterTrade";
import { ITrade, IUserTrade, Trade } from "../../models/Trade";
import { IOrder, Order } from "../../models/Order";

interface IMapTradingPlatformToQueueUrlResponse {
	ordersActivationQueue?: string;
	stopLossOrdersQueue?: string;
	takeProfitOrdersQueue?: string;
	closeTradeQueue?: string;
}
export class TradeService {
	public async getActiveMasterTrades(): Promise<{
		trades: IMasterTrade[];
		tradesAggregate: ITradeAggregate;
	}> {
		const trades = await MasterTrade.find({
			status: {
				$in: [
					TradeStatus.ACTIVE,
					TradeStatus.PENDING,
					TradeStatus.PROCESSING,
					TradeStatus.PROCESSED,
					TradeStatus.BREAK_EVEN,
				],
			},
		}).sort({ createdAt: -1 });

		const { totalBalance, totalRisk } = trades.reduce(
			(acc, trade) => ({
				totalBalance: acc.totalBalance + trade.pnl,
				totalRisk: acc.totalRisk + trade.estimatedLoss,
			}),
			{
				totalBalance: 0,
				totalRisk: 0,
			}
		);

		const tradesAggregate = this.calculateTradesAggregate({ totalBalance, totalRisk });

		return {
			trades,
			tradesAggregate,
		};
	}

	public async getUserActiveTrades({
		userId,
	}: {
		userId: string;
	}): Promise<{ trades: IUserTrade[]; tradesAggregate: ITradeAggregate }> {
		const trades = await Trade.find({
			userId,
			status: {
				$in: [
					TradeStatus.ACTIVE,
					TradeStatus.PENDING,
					TradeStatus.PROCESSING,
					TradeStatus.PROCESSED,
					TradeStatus.BREAK_EVEN,
				],
			},
		})
			.populate({
				path: "masterTradeId",
				select: "baseAssetLogoUrl currentPrice -_id",
			})
			.sort({ createdAt: -1 })
			.lean();

		// Calculate aggregate values during mapping to avoid second iteration
		let totalBalance = 0;
		let totalRisk = 0;

		const userTrades = trades.map((trade: any) => {
			const { pnlAmount, pnlPercentOfRisk } = this.calculatePnL({
				side: trade.side,
				entryPrice: trade.entryPrice,
				baseQuantity: trade.baseQuantity,
				targetPrice: trade.takeProfitPrice,
				riskUSDT: trade.estimatedLoss,
				requiredMargin: trade.quoteTotal,
			});

			// Accumulate for aggregate calculation
			totalBalance += pnlAmount || 0;
			totalRisk += trade.estimatedLoss || 0;

			const userTrade: IUserTrade = {
				...trade,
				baseAssetLogoUrl: trade.masterTradeId?.baseAssetLogoUrl,
				currentPrice: trade.masterTradeId?.currentPrice,
				pnl: pnlAmount,
				pnlPercentage: pnlPercentOfRisk,
			};

			return userTrade;
		});

		const tradesAggregate = this.calculateTradesAggregate({ totalBalance, totalRisk });

		return {
			trades: userTrades,
			tradesAggregate,
		};
	}

	public async getMasterTradeById(id: string): Promise<IMasterTrade | null> {
		const trade = await MasterTrade.findById(id);

		if (!trade) {
			return null;
		}
		return trade as IMasterTrade;
	}

	public async createMasterTrade(newTrade: ICreateMasterTrade): Promise<IMasterTrade | null> {
		// If supported trading platforms includes BYBIT, set default trading platform to BYBIT, else if it includes BINANCE, set default trading platform to BINANCE, else set default trading platform to first supported trading platform
		const defaultTradingPlatform = newTrade.supportedTradingPlatforms.includes(
			TradingPlatform.BYBIT
		)
			? TradingPlatform.BYBIT
			: newTrade.supportedTradingPlatforms.includes(TradingPlatform.BINANCE)
			? TradingPlatform.BINANCE
			: newTrade.supportedTradingPlatforms[0];
		const createdTrade = await MasterTrade.create({ ...newTrade, defaultTradingPlatform });
		return createdTrade;
	}

	private calculateTradesAggregate({
		totalBalance,
		totalRisk,
	}: {
		totalBalance: number;
		totalRisk: number;
	}): ITradeAggregate {
		const accummulatedUnrealisedPnL = Number((totalBalance - totalRisk).toFixed(2));

		// If totalRisk is zero and accumulatedUnrealisedPnL is positive, use 1 as denominator to convert to percentage
		const accummulatedUnrealisedPnLPercentage = Number(
			(totalRisk === 0 && accummulatedUnrealisedPnL > 0
				? accummulatedUnrealisedPnL * 100
				: totalRisk === 0
				? 0
				: (accummulatedUnrealisedPnL / totalRisk) * 100
			).toFixed(2)
		); // Otherwise use normal percentage calculation

		return {
			accummulatedTotalBalance: totalBalance,
			accummulatedTotalRisk: totalRisk,
			accummulatedUnrealisedPnL,
			accummulatedUnrealisedPnLPercentage,
		};
	}

	public calculatePnL({
		side,
		entryPrice,
		targetPrice,
		baseQuantity,
		riskUSDT,
		requiredMargin,
	}: {
		side: TradeSide;
		entryPrice: number;
		targetPrice: number;
		baseQuantity: number;
		riskUSDT: number;
		requiredMargin: number;
	}): {
		pnlAmount: number;
		pnlPercentOfRisk: number;
		pnlPercentOfRequiredMargin: number;
	} {
		const priceDiff =
			side === TradeSide.LONG ? targetPrice - entryPrice : entryPrice - targetPrice;

		const pnlAmount = priceDiff * baseQuantity;

		return {
			pnlAmount: Number(pnlAmount.toFixed(2)),
			pnlPercentOfRisk:
				riskUSDT === 0 ? 0 : Number(((pnlAmount / riskUSDT) * 100).toFixed(2)),
			pnlPercentOfRequiredMargin:
				requiredMargin === 0 ? 0 : Number(((pnlAmount / requiredMargin) * 100).toFixed(2)),
		};
	}

	public async getUserTradesForMasterTrade({
		masterTradeId,
		statuses,
	}: {
		masterTradeId: string;
		statuses: TradeStatus[];
	}): Promise<ITrade[]> {
		return Trade.find({ masterTradeId, status: { $in: statuses } });
	}

	public async getUserTradeOrder({
		tradeId,
		orderType,
	}: {
		tradeId: string;
		orderType: OrderType;
	}): Promise<IOrder | null> {
		return Order.findOne({ tradeId, orderType });
	}

	public mapTradingPlatformToQueueUrl(
		tradingPlatform?: TradingPlatform
	): IMapTradingPlatformToQueueUrlResponse {
		if (!tradingPlatform) {
			return {
				ordersActivationQueue: "",
				stopLossOrdersQueue: "",
				takeProfitOrdersQueue: "",
				closeTradeQueue: "",
			};
		}
		if (tradingPlatform === TradingPlatform.BYBIT) {
			return {
				ordersActivationQueue: process.env.PROCESS_BYBIT_ORDERS_ACTIVATION_QUEUE ?? "",
				stopLossOrdersQueue: process.env.PROCESS_BYBIT_STOP_LOSS_ORDERS_QUEUE ?? "",
				takeProfitOrdersQueue: process.env.PROCESS_BYBIT_TAKE_PROFIT_ORDERS_QUEUE ?? "",
				closeTradeQueue: process.env.PROCESS_BYBIT_CLOSE_TRADE_QUEUE ?? "",
			};
		}
		return {
			ordersActivationQueue: "",
			stopLossOrdersQueue: "",
			takeProfitOrdersQueue: "",
			closeTradeQueue: "",
		};
	}

	private async closeActiveMasterTradeOperations({
		masterTrade,
		qtyPercentToClose,
		status = TradeStatus.BREAK_EVEN,
		userTrades,
	}: {
		masterTrade: IMasterTrade;
		qtyPercentToClose: number;
		status?: TradeStatus;
		userTrades: ITrade[];
	}): Promise<void> {
		if (qtyPercentToClose >= 100) {
			// update master trade status to CLOSED
			await MasterTrade.updateOne(
				{ _id: masterTrade._id },
				{
					$set: {
						status: TradeStatus.CLOSED,
					},
				}
			);
		} else {
			const qtyToClose = masterTrade.baseQuantity * (qtyPercentToClose / 100);
			const qtyRemaining = masterTrade.baseQuantity - qtyToClose;

			const quoteTotalToClose = masterTrade.quoteTotal * (qtyPercentToClose / 100);
			const quoteToalRemaining = masterTrade.quoteTotal - quoteTotalToClose;

			const estimatedProfitToClose = masterTrade.estimatedProfit * (qtyPercentToClose / 100);
			const estimatedProfitRemaining = masterTrade.estimatedProfit - estimatedProfitToClose;

			const estimatedLossToClose = masterTrade.estimatedLoss * (qtyPercentToClose / 100);
			const estimatedLossRemaining = masterTrade.estimatedLoss - estimatedLossToClose;
			await MasterTrade.updateOne(
				{ _id: masterTrade._id },
				{
					$set: {
						baseQuantity: qtyRemaining,
						quoteTotal: quoteToalRemaining,
						estimatedProfit: estimatedProfitRemaining,
						estimatedLoss: estimatedLossRemaining,
						status,
					},
				}
			);
		}

		// publish user trades to queue
		await Promise.all(
			userTrades.map(async (userTrade) => {
				const event: ICloseTradeEvent = { trade: userTrade, qtyPercentToClose };
				await publishMessageToQueue({
					queueUrl:
						this.mapTradingPlatformToQueueUrl(userTrade.platformName).closeTradeQueue ??
						"",
					message: JSON.stringify(event),
				});
				return userTrade;
			})
		);
	}

	private async triggerMasterTradeOrdersPlacementOperations(masterTrade: IMasterTrade) {
		const processUserTradingWithMasterTradeEvent: IProcessUserTradingWithMasterTradeEvent = {
			masterTradeId: masterTrade.id,
			stopLossPrice: masterTrade.stopLossPrice,
			takeProfitPrice: masterTrade.takeProfitPrice ?? 0,
			entryPrice: masterTrade.entryPrice,
			baseAsset: masterTrade.baseAsset,
			quoteCurrency: masterTrade.quoteCurrency,
			pair: masterTrade.pair,
			supportedTradingPlatforms: masterTrade.supportedTradingPlatforms,
			defaultTradingPlatform: masterTrade.defaultTradingPlatform,
			tradeSide: masterTrade.side,
			targetOrdersAmountToFill: masterTrade.targetOrdersAmountToFill,
			orderPlacementType: masterTrade.orderPlacementType,
			accountType: masterTrade.accountType,
			baseAssetLogoUrl: masterTrade.baseAssetLogoUrl,
		};

		// Publish master trade to queue and update trade status to ACTIVE
		await Promise.all([
			publishMessageToQueue({
				queueUrl: process.env.PROCESS_INCOMING_MASTER_TRADES_QUEUE ?? "",
				message: JSON.stringify(processUserTradingWithMasterTradeEvent),
			}),
			MasterTrade.updateOne(
				{ _id: masterTrade._id },
				{
					$set: {
						status: TradeStatus.PROCESSING,
						pnl: 0,
						pnlPercentage: 0,
					},
				}
			),
		]);
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
			await Promise.all(
				trades.map(async (trade) => {
					const candle = ohlcMap.get(trade.pair);
					if (!candle) {
						console.warn(`No candle data found for pair: ${trade.pair}`);
						return;
					}

					if (
						trade.status === TradeStatus.ACTIVE ||
						trade.status === TradeStatus.BREAK_EVEN
					) {
						await this.processActiveMasterTrade(trade, candle);
					} else if (trade.status === TradeStatus.PROCESSED) {
						await this.processProcessedMasterTrade(trade, candle);
					} else if (trade.status === TradeStatus.PENDING) {
						await this.processPendingMasterTrade(trade, candle);
					}
				})
			);

			// await Promise.all(updatePromises);
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
	private async processActiveMasterTrade(
		masterTrade: IMasterTrade,
		candle: IOHLCData
	): Promise<void> {
		const closePrice = parseFloat(candle.close);

		// Calculate PNL percentage and amount based on trade side
		const { pnlAmount, pnlPercentOfRisk } = this.calculatePnL({
			side: masterTrade.side,
			entryPrice: masterTrade.entryPrice,
			targetPrice: closePrice,
			baseQuantity: masterTrade.baseQuantity,
			riskUSDT: masterTrade.estimatedLoss,
			requiredMargin: masterTrade.quoteTotal,
		});

		// Update trade in database
		await MasterTrade.updateOne(
			{ _id: masterTrade._id },
			{
				$set: {
					currentPrice: closePrice,
					pnl: pnlAmount,
					pnlPercentage: pnlPercentOfRisk,
				},
			}
		);

		// process master trade when stop loss and take profit prices are reached
		await Promise.all([
			this.processMasterTradeWhenStopLossIsReached(masterTrade, candle),
			this.processMasterTradeWhenTakeProfitIsReached(masterTrade, candle),
		]);

		console.log(
			`Updated ACTIVE master trade ${
				masterTrade.pair
			} - Price: ${closePrice}, PNL: ${pnlAmount.toFixed(2)} (${pnlPercentOfRisk.toFixed(
				2
			)}%)`
		);
	}

	/**
	 * Process PROCESSED trade - check if entry price is reached
	 */
	private async processProcessedMasterTrade(
		masterTrade: IMasterTrade,
		candle: IOHLCData
	): Promise<void> {
		const highPrice = parseFloat(candle.high);
		const lowPrice = parseFloat(candle.low);
		const currentPrice = parseFloat(candle.close);
		let entryPriceReached = false;

		// Check if entry price is reached based on trade side
		if (masterTrade.side === TradeSide.LONG) {
			// For LONG trades, check if HIGH price reached or exceeded trigger
			entryPriceReached = lowPrice <= masterTrade.entryPrice;
		} else {
			// For SHORT trades, check if LOW price reached or went below trigger
			entryPriceReached = highPrice >= masterTrade.entryPrice;
		}

		if (entryPriceReached) {
			try {
				// get user trades for this master trade
				const userTrades = await this.getUserTradesForMasterTrade({
					masterTradeId: (masterTrade._id as mongoose.Types.ObjectId).toString(),
					statuses: [TradeStatus.PROCESSED],
				});

				// update user trades status to ACTIVATING
				await Promise.all(
					userTrades.map(async (userTrade) => {
						await Trade.updateOne(
							{ _id: userTrade._id },
							{ $set: { status: TradeStatus.ACTIVATING } }
						);
					})
				);

				// publish user trades to queue
				const { ordersActivationQueue } = this.mapTradingPlatformToQueueUrl(
					userTrades[0].platformName
				);
				if (!ordersActivationQueue) {
					console.warn(
						`No orders activation queue found for platform: ${userTrades[0].platformName}`
					);
					return;
				}
				await Promise.all(
					userTrades.map(async (userTrade) => {
						await publishMessageToQueue({
							queueUrl: ordersActivationQueue,
							message: JSON.stringify(userTrade),
						});
						return userTrade;
					})
				);

				// update master trade status to ACTIVE
				await MasterTrade.updateOne(
					{ _id: masterTrade._id },
					{
						$set: {
							status: TradeStatus.ACTIVE,
							currentPrice,
							pnl: 0,
							pnlPercentage: 0,
						},
					}
				);

				console.log(
					`✅ PROCESSED master trade ${
						masterTrade.pair
					} ACTIVATED - Trigger and published to queue: ${
						masterTrade.ordersTriggerPrice
					}, ${masterTrade.side === TradeSide.LONG ? "Low" : "High"}: ${
						masterTrade.side === TradeSide.LONG ? lowPrice : highPrice
					}`
				);
			} catch (error) {
				console.log(
					"=================== Error occurred while processing processed master trade ======================",
					error
				);
				throw error;
			}
		} else {
			await MasterTrade.updateOne(
				{ _id: masterTrade._id },
				{
					$set: { currentPrice },
				}
			);
		}
	}

	/**
	 * Process PENDING trade - check if trigger price is reached
	 */
	private async processPendingMasterTrade(
		masterTrade: IMasterTrade,
		candle: IOHLCData
	): Promise<void> {
		const highPrice = parseFloat(candle.high);
		const lowPrice = parseFloat(candle.low);
		const currentPrice = parseFloat(candle.close);
		let triggerReached = false;

		// Check if trigger price is reached based on trade side
		if (masterTrade.side === TradeSide.LONG) {
			// For LONG trades, check if HIGH price reached or exceeded trigger
			triggerReached = lowPrice <= masterTrade.ordersTriggerPrice;
		} else {
			// For SHORT trades, check if LOW price reached or went below trigger
			triggerReached = highPrice >= masterTrade.ordersTriggerPrice;
		}

		if (triggerReached) {
			try {
				await this.triggerMasterTradeOrdersPlacementOperations(masterTrade);

				console.log(
					`✅ PENDING master trade ${
						masterTrade.pair
					} PROCESSING - Trigger and published to queue: ${
						masterTrade.ordersTriggerPrice
					}, ${masterTrade.side === TradeSide.LONG ? "Low" : "High"}: ${
						masterTrade.side === TradeSide.LONG ? lowPrice : highPrice
					}`
				);
			} catch (error) {
				console.log(
					"=================== Error occurred while processing pending master trade ======================",
					error
				);
				throw error;
			}
		} else {
			await MasterTrade.updateOne(
				{ _id: masterTrade._id },
				{
					$set: { currentPrice },
				}
			);
		}
	}

	private async processMasterTradeWhenStopLossIsReached(
		masterTrade: IMasterTrade,
		candle: IOHLCData
	): Promise<void> {
		const highPrice = parseFloat(candle.high);
		const lowPrice = parseFloat(candle.low);
		let stopLossPriceReached = false;

		// Check if stop loss price is reached based on trade side
		if (masterTrade.side === TradeSide.LONG) {
			// For LONG trades, check if HIGH price reached or exceeded trigger
			stopLossPriceReached = lowPrice <= masterTrade.stopLossPrice;
		} else {
			// For SHORT trades, check if LOW price reached or went below trigger
			stopLossPriceReached = highPrice >= masterTrade.stopLossPrice;
		}

		if (stopLossPriceReached) {
			try {
				// get user trades for this master trade
				const userTrades = await this.getUserTradesForMasterTrade({
					masterTradeId: (masterTrade._id as mongoose.Types.ObjectId).toString(),
					statuses: [TradeStatus.ACTIVE, TradeStatus.BREAK_EVEN],
				});

				// close active master trade operations
				await this.closeActiveMasterTradeOperations({
					masterTrade,
					qtyPercentToClose: 100,
					userTrades,
				});

				console.log(
					`✅ STOP LOSS PRICE REACHED - trade ${
						masterTrade.pair
					} CLOSED - Trigger and published to queue: ${masterTrade.ordersTriggerPrice}, ${
						masterTrade.side === TradeSide.LONG ? "Low" : "High"
					}: ${masterTrade.side === TradeSide.LONG ? lowPrice : highPrice}`
				);
			} catch (error) {
				console.log(
					"=================== Error occurred while processing master trade when stop loss is reached ======================",
					error
				);
				throw error;
			}
		}
	}

	private async processMasterTradeWhenTakeProfitIsReached(
		masterTrade: IMasterTrade,
		candle: IOHLCData
	): Promise<void> {
		const highPrice = parseFloat(candle.high);
		const lowPrice = parseFloat(candle.low);
		let takeProfitPriceReached = false;

		if (!masterTrade.takeProfitPrice) {
			return;
		}

		// Check if take profit price is reached based on trade side
		if (masterTrade.side === TradeSide.LONG) {
			// For LONG trades, check if HIGH price reached or exceeded trigger
			takeProfitPriceReached = lowPrice <= masterTrade.takeProfitPrice;
		} else {
			// For SHORT trades, check if LOW price reached or went below trigger
			takeProfitPriceReached = highPrice >= masterTrade.takeProfitPrice;
		}

		if (takeProfitPriceReached) {
			try {
				// get user trades for this master trade
				const userTrades = await this.getUserTradesForMasterTrade({
					masterTradeId: (masterTrade._id as mongoose.Types.ObjectId).toString(),
					statuses: [TradeStatus.ACTIVE, TradeStatus.BREAK_EVEN],
				});

				// close active master trade operations
				await this.closeActiveMasterTradeOperations({
					masterTrade,
					qtyPercentToClose: 100,
					userTrades,
				});

				console.log(
					`✅ TAKE PROFIT PRICE REACHED - trade ${
						masterTrade.pair
					} CLOSED - Trigger and published to queue: ${masterTrade.takeProfitPrice}, ${
						masterTrade.side === TradeSide.LONG ? "Low" : "High"
					}: ${masterTrade.side === TradeSide.LONG ? lowPrice : highPrice}`
				);
			} catch (error) {
				console.log(
					"=================== Error occurred while processing master trade when take profit is reached ======================",
					error
				);
				throw error;
			}
		}
	}

	private async setMasterTradeStopLossOrTakeProfitOperations({
		masterTrade,
		stopLossPrice,
		takeProfitPrice,
		userTrades,
	}: {
		masterTrade: IMasterTrade;
		stopLossPrice: number;
		takeProfitPrice?: number;
		userTrades: ITrade[];
	}) {
		// Check if stop loss price was provided and is different from the current stop loss price, then update stop loss price
		if (stopLossPrice !== masterTrade.stopLossPrice) {
			await MasterTrade.updateOne({ _id: masterTrade._id }, { $set: { stopLossPrice } });

			// publish user trades to queue
			await Promise.all(
				userTrades.map(async (userTrade) =>
					publishMessageToQueue({
						queueUrl:
							this.mapTradingPlatformToQueueUrl(userTrade.platformName)
								.stopLossOrdersQueue ?? "",
						message: JSON.stringify({ ...userTrade, stopLossPrice }),
					})
				)
			);
		}
		// Check if take profit price was provided and is different from the current take profit price, then update take profit price
		if (takeProfitPrice && takeProfitPrice !== masterTrade.takeProfitPrice) {
			await MasterTrade.updateOne({ _id: masterTrade._id }, { $set: { takeProfitPrice } });

			// publish user trades to queue
			await Promise.all(
				userTrades.map(async (userTrade) =>
					publishMessageToQueue({
						queueUrl:
							this.mapTradingPlatformToQueueUrl(userTrade.platformName)
								.takeProfitOrdersQueue ?? "",
						message: JSON.stringify({ ...userTrade, takeProfitPrice }),
					})
				)
			);
		}

		// Check if take profit price is not provided and exists in db, then set it to undefined
		if (!takeProfitPrice && masterTrade.takeProfitPrice) {
			await MasterTrade.updateOne(
				{ _id: masterTrade._id },
				{ $set: { takeProfitPrice: undefined } }
			);

			// publish user trades to queue
			await Promise.all(
				userTrades.map(async (userTrade) =>
					publishMessageToQueue({
						queueUrl:
							this.mapTradingPlatformToQueueUrl(userTrade.platformName)
								.takeProfitOrdersQueue ?? "",
						message: JSON.stringify({ ...userTrade, takeProfitPrice: undefined }),
					})
				)
			);
		}
	}

	public async setMasterTradeStopLossOrTakeProfit({
		masterTradeId,
		stopLossPrice,
		takeProfitPrice,
	}: {
		masterTradeId: string;
		stopLossPrice: number;
		takeProfitPrice?: number;
	}): Promise<void> {
		const masterTrade = await this.getMasterTradeById(masterTradeId);
		if (!masterTrade) {
			throw ApplicationError({
				name: ErrorName.NOT_FOUND,
				message: `Master trade not found with id: ${masterTradeId}`,
			});
		}

		if (![TradeStatus.ACTIVE, TradeStatus.BREAK_EVEN].includes(masterTrade.status)) {
			throw ApplicationError({
				name: ErrorName.FORBIDDEN,
				message: `Master trade is not active with id: ${masterTradeId}`,
			});
		}

		// get user trades for this master trade
		const userTrades = await this.getUserTradesForMasterTrade({
			masterTradeId: (masterTrade._id as mongoose.Types.ObjectId).toString(),
			statuses: [TradeStatus.ACTIVE, TradeStatus.BREAK_EVEN],
		});

		await this.setMasterTradeStopLossOrTakeProfitOperations({
			masterTrade,
			stopLossPrice,
			takeProfitPrice,
			userTrades,
		});
	}

	public async closeActiveMasterTrade({
		masterTradeId,
		qtyPercentToClose = 100,
	}: {
		masterTradeId: string;
		qtyPercentToClose?: number;
	}): Promise<void> {
		const masterTrade = await this.getMasterTradeById(masterTradeId);
		if (!masterTrade) {
			throw ApplicationError({
				name: ErrorName.NOT_FOUND,
				message: `Master trade not found with id: ${masterTradeId}`,
			});
		}

		if (![TradeStatus.ACTIVE, TradeStatus.BREAK_EVEN].includes(masterTrade.status)) {
			throw ApplicationError({
				name: ErrorName.FORBIDDEN,
				message: `Master trade is not active with id: ${masterTradeId}`,
			});
		}

		// get user trades for this master trade
		const userTrades = await this.getUserTradesForMasterTrade({
			masterTradeId: (masterTrade._id as mongoose.Types.ObjectId).toString(),
			statuses: [TradeStatus.ACTIVE, TradeStatus.BREAK_EVEN],
		});

		// close active master trade operations
		await this.closeActiveMasterTradeOperations({ masterTrade, qtyPercentToClose, userTrades });
	}

	public async breakEvenActiveMasterTrade(masterTradeId: string): Promise<void> {
		const masterTrade = await this.getMasterTradeById(masterTradeId);
		if (!masterTrade) {
			throw ApplicationError({
				name: ErrorName.NOT_FOUND,
				message: `Master trade not found with id: ${masterTradeId}`,
			});
		}

		if (masterTrade.status !== TradeStatus.ACTIVE) {
			throw ApplicationError({
				name: ErrorName.FORBIDDEN,
				message: `Master trade is not active with id: ${masterTradeId}`,
			});
		}

		// get user trades for this master trade
		const userTrades = await this.getUserTradesForMasterTrade({
			masterTradeId: (masterTrade._id as mongoose.Types.ObjectId).toString(),
			statuses: [TradeStatus.ACTIVE, TradeStatus.BREAK_EVEN],
		});

		await this.closeActiveMasterTradeOperations({
			masterTrade,
			qtyPercentToClose: 50,
			userTrades,
		});
		await this.setMasterTradeStopLossOrTakeProfitOperations({
			masterTrade,
			stopLossPrice: masterTrade.entryPrice,
			userTrades,
		});
	}

	public async triggerMasterTradeOrdersPlacement(masterTradeId: string) {
		const masterTrade = await this.getMasterTradeById(masterTradeId);
		if (!masterTrade) {
			throw ApplicationError({
				name: ErrorName.NOT_FOUND,
				message: `Master trade not found with id: ${masterTradeId}`,
			});
		}

		if (masterTrade.status !== TradeStatus.PENDING) {
			throw ApplicationError({
				name: ErrorName.FORBIDDEN,
				message: `Master trade with id: ${masterTradeId} is not pending and cannot be triggered for orders placement`,
			});
		}

		await this.triggerMasterTradeOrdersPlacementOperations(masterTrade);
		console.log("Orders placement successfully trigger for master trade", { masterTrade });
	}

	public async cancelNoneActiveMasterTrade(masterTradeId: string) {
		const masterTrade = await this.getMasterTradeById(masterTradeId);
		if (!masterTrade) {
			throw ApplicationError({
				name: ErrorName.NOT_FOUND,
				message: `Master trade not found with id: ${masterTradeId}`,
			});
		}

		if (![TradeStatus.PENDING, TradeStatus.PROCESSED].includes(masterTrade.status)) {
			throw ApplicationError({
				name: ErrorName.FORBIDDEN,
				message: `Master trade with id: ${masterTradeId} is not pending or processed and cannot be canceled`,
			});
		}

		// update master trade status to CLOSED
		await MasterTrade.updateOne(
			{ _id: masterTrade._id },
			{
				$set: {
					status: TradeStatus.CANCELED,
				},
			}
		);

		if (masterTrade.status === TradeStatus.PROCESSED) {
			// publish user trade orders to queue so they can be canceled
			// get user trades for this master trade
			const userTrades = await this.getUserTradesForMasterTrade({
				masterTradeId: (masterTrade._id as mongoose.Types.ObjectId).toString(),
				statuses: [TradeStatus.PROCESSED],
			});

			console.log({ userTrades });
		}
		// console.log("Orders placement successfully trigger for master trade", { masterTrade });
	}
}
