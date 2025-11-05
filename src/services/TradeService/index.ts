import { SortOrder } from "mongoose";
import { IOHLCData } from "../../clients/BinanceFuturesClient";
import { publishMessageToQueue } from "../../clients/SQSClient/helpers";
import { TradeSide, TradeStatus, TradingPlatform as TradingPlatformEnum } from "../../config/enums";
import {
	IGetAllTradeAssetParams,
	IGetAllTradingPlatformQuery,
	IGetAllTradingPlatformsParam,
	IGetSupportedTradingPlatforms,
	IProcessUserTradingWithMasterTradeEvent,
	ISupportedTradingPlatform,
} from "../../config/interfaces";
import Asset, { IAsset } from "../../models/Asset";
import { ICreateMasterTrade, IMasterTrade, MasterTrade } from "../../models/MasterTrade";
import { IUserTrade, Trade } from "../../models/Trade";
import Currency, { ICurrency } from "../../models/Currency";
import TradingPlatformPair from "../../models/TradingPlatformPair";
import TradingPlatform, { ITradingPlatform } from "../../models/TradingPlatform";

export class TradeService {
	public async getAllTradeAssets({
		category,
		page,
		rowsPerPage,
		orderBy,
		sortBy,
	}: IGetAllTradeAssetParams): Promise<IAsset[] | null> {
		try {
			const offset = (page - 1) * rowsPerPage;

			// Construct the dynamic sorting object
			const sortOptions: Record<string, SortOrder> = {};
			sortOptions[sortBy] = orderBy === "asc" ? 1 : -1;

			const exchanges = await Asset.find({
				isTradingActive: true,
				isCoinActive: true,
				category,
			})
				.sort(sortOptions)
				.skip(offset)
				.limit(rowsPerPage)
				.select({
					id: 1,
					name: 1,
					symbol: 1,
					rank: 1,
					logo: 1,
					dateLaunched: 1,
					urls: 1,
				});

			if (!exchanges) {
				return null;
			}

			return exchanges;
		} catch (error) {
			if (error instanceof Error) {
				throw new Error(error.message);
			}
			throw new Error("An unknown error occurred while retrieving trade assets.");
		}
	}

	public async getSupportedCurrencies(): Promise<ICurrency[] | null> {
		try {
			const currencies = await Currency.find({}).where({ isTradingActive: true }).select({
				id: 1,
				name: 1,
				symbol: 1,
				logo: 1,
			});

			if (!currencies || currencies.length === 0) {
				return null;
			}

			return currencies;
		} catch (error) {
			if (error instanceof Error) {
				throw new Error(error.message);
			}
			throw new Error("An unknown error occurred while retrieving supported currencies.");
		}
	}

	public async getSupportedTradingPlatforms({
		baseAssetId,
		quoteCurrencyId,
	}: IGetSupportedTradingPlatforms): Promise<ISupportedTradingPlatform[] | null> {
		try {
			// find and return trading platforms where assetId and currencyId match
			const platforms = await TradingPlatformPair.find({
				assetId: baseAssetId,
				currencyId: quoteCurrencyId,
			})
				.populate({
					path: "platformId", // Populate the exchange details using exchangeId
					match: { status: TradeStatus.ACTIVE },
					select: "id name logo",
				})
				.sort({ name: 1 });

			// Filter out exchange pairs where exchangeId is null (i.e., inactive exchanges)
			const activePlatforms = platforms.filter((platform) => platform.platformId !== null);

			if (!activePlatforms || activePlatforms.length === 0) {
				return null;
			}

			const formattedPlatforms: ISupportedTradingPlatform[] = activePlatforms.map(
				(platform: any) => ({
					_id: platform.platformId._id,
					logo: platform.platformId.logo,
					name: platform.platformId.name,
				})
			);

			return formattedPlatforms;
		} catch (error: any) {
			if (error instanceof Error) {
				throw new Error(error.message);
			}
			throw new Error(
				"An unknown error occurred while retrieving supported trading platforms."
			);
		}
	}

	public async getAllAccountTradingPlatforms({
		page,
		rowsPerPage,
		orderBy,
		status,
	}: IGetAllTradingPlatformsParam): Promise<ITradingPlatform[] | null> {
		try {
			const offset = (page - 1) * rowsPerPage;

			// Create the query object
			const query: IGetAllTradingPlatformQuery = {};
			if (status) {
				query.status = status;
			}

			// Fetch the trading platforms based on the query
			const tardingPlatforms = await TradingPlatform.find(query)
				.sort({ name: orderBy === "asc" ? 1 : -1 })
				.skip(offset)
				.limit(rowsPerPage);

			if (!tardingPlatforms || tardingPlatforms.length === 0) {
				return null;
			}

			return tardingPlatforms;
		} catch (error: any) {
			if (error instanceof Error) {
				throw new Error(error.message);
			}
			throw new Error(
				"An unknown error occurred while retrieving supported trading platforms."
			);
		}
	}

	public async getActiveMasterTrades(): Promise<IMasterTrade[]> {
		return MasterTrade.find({
			status: {
				$in: [
					TradeStatus.ACTIVE,
					TradeStatus.PENDING,
					TradeStatus.PROCESSING,
					TradeStatus.PROCESSED,
				],
			},
		}).sort({ createdAt: -1 });
	}

	public async getUserActiveTrades({ userId }: { userId: string }): Promise<IUserTrade[]> {
		try {
			const trades = await Trade.find({
				userId,
				status: {
					$in: [
						TradeStatus.ACTIVE,
						TradeStatus.PENDING,
						TradeStatus.PROCESSING,
						TradeStatus.PROCESSED,
					],
				},
			})
				.populate({
					path: "masterTradeId",
					select: "baseAssetLogoUrl currentPrice -_id",
				})
				.sort({ createdAt: -1 });

			const userTrades = trades.map((trade: any) => {
				const tradeObj = trade.toObject();
				return {
					...tradeObj,
					baseAssetLogoUrl: tradeObj.masterTradeId?.baseAssetLogoUrl,
					currentPrice: tradeObj.masterTradeId?.currentPrice,
				};
			});

			return userTrades as IUserTrade[];
		} catch (error) {
			if (error instanceof Error) {
				throw new Error(error.message);
			}
			throw new Error("An unknown error occurred while retrieving trades.");
		}
	}

	public async getTradeById(id: string): Promise<IMasterTrade | null> {
		try {
			const trade = await MasterTrade.findById(id);

			if (!trade) {
				return null;
			}
			return trade as IMasterTrade;
		} catch (error) {
			if (error instanceof Error) {
				throw new Error(error.message);
			}
			throw new Error("An unknown error occurred while retrieving the trade.");
		}
	}

	public async createMasterTrade(newTrade: ICreateMasterTrade): Promise<IMasterTrade | null> {
		try {
			// If supported trading platforms includes BYBIT, set default trading platform to BYBIT, else if it includes BINANCE, set default trading platform to BINANCE, else set default trading platform to first supported trading platform
			const defaultTradingPlatform = newTrade.supportedTradingPlatforms.includes(
				TradingPlatformEnum.BYBIT
			)
				? TradingPlatformEnum.BYBIT
				: newTrade.supportedTradingPlatforms.includes(TradingPlatformEnum.BINANCE)
				? TradingPlatformEnum.BINANCE
				: newTrade.supportedTradingPlatforms[0];
			const createdTrade = await MasterTrade.create({ ...newTrade, defaultTradingPlatform });
			return createdTrade;
		} catch (error: unknown) {
			if (error instanceof Error) {
				throw new Error(error.message);
			}
			throw new Error("An unknown error occurred while creating trade.");
		}
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

					if (trade.status === TradeStatus.ACTIVE) {
						console.log("Inside ACTIVE trade block", { trade, candle });
						await this.processActiveTrade(trade, candle);
					} else if (trade.status === TradeStatus.PROCESSED) {
						console.log("Inside PROCESSED trade block", { trade, candle });
						await this.processProcessedTrade(trade, candle);
					} else if (trade.status === TradeStatus.PENDING) {
						console.log("Inside PENDING trade block", { trade, candle });
						await this.processPendingTrade(trade, candle);
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
	private async processActiveTrade(trade: IMasterTrade, candle: IOHLCData): Promise<void> {
		const closePrice = parseFloat(candle.close);

		// Calculate PNL percentage and amount based on trade side
		const { pnlAmount, pnlPercentOfRisk } = this.calculatePnL({
			side: trade.side,
			entryPrice: trade.entryPrice,
			targetPrice: closePrice,
			baseQuantity: trade.baseQuantity,
			riskUSDT: trade.estimatedLoss,
			requiredMargin: trade.quoteTotal,
		});

		// Update trade in database
		await MasterTrade.updateOne(
			{ _id: trade._id },
			{
				$set: {
					currentPrice: closePrice,
					pnl: pnlAmount,
					pnlPercentage: pnlPercentOfRisk,
				},
			}
		);

		console.log(
			`Updated ACTIVE trade ${trade.pair} - Price: ${closePrice}, PNL: ${pnlAmount.toFixed(
				2
			)} (${pnlPercentOfRisk.toFixed(2)}%)`
		);
	}

	/**
	 * Process PROCESSED trade - check if entry price is reached
	 */
	private async processProcessedTrade(trade: IMasterTrade, candle: IOHLCData): Promise<void> {
		const highPrice = parseFloat(candle.high);
		const lowPrice = parseFloat(candle.low);
		let entryPriceReached = false;

		// Check if trigger price is reached based on trade side
		if (trade.side === TradeSide.LONG) {
			// For LONG trades, check if HIGH price reached or exceeded trigger
			entryPriceReached = lowPrice <= trade.entryPrice;
		} else {
			// For SHORT trades, check if LOW price reached or went below trigger
			entryPriceReached = highPrice >= trade.entryPrice;
		}

		if (entryPriceReached) {
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
						baseAssetLogoUrl: trade.baseAssetLogoUrl,
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
								status: TradeStatus.PROCESSING,
								currentPrice,
								pnl: 0,
								pnlPercentage: 0,
							},
						}
					),
				]);

				console.log(
					`✅ PENDING trade ${trade.pair} PROCESSING - Trigger and published to queue: ${
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
