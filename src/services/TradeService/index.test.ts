/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { TradeService } from "./index";
import { ICreateMasterTrade, IMasterTrade, MasterTrade } from "../../models/MasterTrade";
import {
	TradeStatus,
	TradeSide,
	TradingPlatform,
	AccountType,
	OrderPlacementType,
	Category,
	TradeRisk,
	CandleStick,
} from "../../config/enums";
import { IOHLCData } from "../../clients/BinanceFuturesClient";
import { Trade } from "../../models/Trade";

// Mock the SQS helper
const mockPublishMessageToQueue = jest.fn().mockResolvedValue(undefined);
jest.mock("../../clients/SQSClient/helpers", () => ({
	publishMessageToQueue: (params: any) => mockPublishMessageToQueue(params),
}));

describe("TradeService", () => {
	let tradeService: TradeService;

	beforeEach(() => {
		tradeService = new TradeService();
		mockPublishMessageToQueue.mockClear();
	});

	afterEach(async () => {
		jest.clearAllMocks();
	});

	describe("getActiveMasterTrades", () => {
		it("should return all non-closed trades", async () => {
			// Create test trades
			await MasterTrade.create([
				{
					baseAsset: "BTC",
					baseAssetLogoUrl: "logo.png",
					quoteCurrency: "USDT",
					baseQuantity: 0.1,
					quoteTotal: 6000,
					currentPrice: 60000,
					entryPrice: 60000,
					stopLossPrice: 58000,
					takeProfitPrice: 65000,
					ordersTriggerPrice: 59500,
					targetOrdersAmountToFill: 100,
					pair: "BTCUSDT",
					side: TradeSide.LONG,
					status: TradeStatus.ACTIVE,
					supportedTradingPlatforms: [TradingPlatform.BINANCE],
					defaultTradingPlatform: TradingPlatform.BINANCE,
					candlestick: CandleStick.fifteenMin,
					risk: TradeRisk.low,
					category: Category.CRYPTO,
				},
				{
					baseAsset: "ETH",
					baseAssetLogoUrl: "logo.png",
					quoteCurrency: "USDT",
					baseQuantity: 1,
					quoteTotal: 3000,
					currentPrice: 3000,
					entryPrice: 3000,
					stopLossPrice: 2900,
					takeProfitPrice: 3200,
					ordersTriggerPrice: 2950,
					targetOrdersAmountToFill: 100,
					pair: "ETHUSDT",
					side: TradeSide.LONG,
					status: TradeStatus.PENDING,
					supportedTradingPlatforms: [TradingPlatform.BINANCE],
					defaultTradingPlatform: TradingPlatform.BINANCE,
					candlestick: CandleStick.fifteenMin,
					risk: TradeRisk.low,
					category: Category.CRYPTO,
				},
				{
					baseAsset: "BNB",
					baseAssetLogoUrl: "logo.png",
					quoteCurrency: "USDT",
					baseQuantity: 10,
					quoteTotal: 5000,
					currentPrice: 500,
					entryPrice: 500,
					stopLossPrice: 480,
					takeProfitPrice: 520,
					ordersTriggerPrice: 495,
					targetOrdersAmountToFill: 100,
					pair: "BNBUSDT",
					side: TradeSide.SHORT,
					status: TradeStatus.CLOSED,
					supportedTradingPlatforms: [TradingPlatform.BINANCE],
					defaultTradingPlatform: TradingPlatform.BINANCE,
					candlestick: CandleStick.fifteenMin,
					risk: TradeRisk.low,
					category: Category.CRYPTO,
				},
			]);

			const { trades } = await tradeService.getActiveMasterTrades();

			expect(trades).toHaveLength(2);
			expect(trades.some((t) => t.status === TradeStatus.CLOSED)).toBe(false);
		});

		it("should return empty array when no active trades exist", async () => {
			const { trades } = await tradeService.getActiveMasterTrades();
			expect(trades).toEqual([]);
		});
	});

	describe("createMasterTrade", () => {
		it("should successfully create a new master trades with different supported trading platforms", async () => {
			const masterTradeInputOne: ICreateMasterTrade = {
				baseAsset: "BTC",
				baseAssetLogoUrl: "logo.png",
				quoteCurrency: "USDT",
				baseQuantity: 0.1,
				quoteTotal: 6000,
				originalBaseQuantity: 0.1,
				originalQuoteTotal: 6000,
				currentPrice: 60000,
				entryPrice: 60000,
				stopLossPrice: 58000,
				takeProfitPrice: 65000,
				ordersTriggerPrice: 59500,
				targetOrdersAmountToFill: 100,
				pair: "BTCUSDT",
				side: TradeSide.LONG,
				status: TradeStatus.PENDING,
				supportedTradingPlatforms: [
					TradingPlatform.BINANCE,
					TradingPlatform.BYBIT,
					TradingPlatform.KUCOIN,
				],
				estimatedProfit: 0,
				estimatedLoss: 0,
				originalEstimatedLoss: 0,
				originalEstimatedProfit: 0,
				candlestick: CandleStick.fifteenMin,
				risk: TradeRisk.low,
				category: Category.CRYPTO,
			};

			const masterTradeInputTwo: ICreateMasterTrade = {
				baseAsset: "ETH",
				baseAssetLogoUrl: "logo.png",
				quoteCurrency: "USDT",
				baseQuantity: 0.1,
				quoteTotal: 6000,
				currentPrice: 60000,
				entryPrice: 60000,
				stopLossPrice: 58000,
				takeProfitPrice: 65000,
				ordersTriggerPrice: 59500,
				targetOrdersAmountToFill: 100,
				pair: "ETHUSDT",
				side: TradeSide.LONG,
				status: TradeStatus.PENDING,
				supportedTradingPlatforms: [TradingPlatform.BINANCE, TradingPlatform.KUCOIN],
				estimatedProfit: 0,
				estimatedLoss: 0,
				candlestick: CandleStick.fifteenMin,
				risk: TradeRisk.low,
				category: Category.CRYPTO,
				originalBaseQuantity: 0.1,
				originalQuoteTotal: 6000,
				originalEstimatedLoss: 0,
				originalEstimatedProfit: 0,
			};

			const masterTradeInputThree: ICreateMasterTrade = {
				baseAsset: "BNB",
				baseAssetLogoUrl: "logo.png",
				quoteCurrency: "USDT",
				baseQuantity: 0.1,
				quoteTotal: 6000,
				currentPrice: 60000,
				entryPrice: 60000,
				stopLossPrice: 58000,
				takeProfitPrice: 65000,
				ordersTriggerPrice: 59500,
				targetOrdersAmountToFill: 100,
				pair: "BNBUSDT",
				side: TradeSide.LONG,
				status: TradeStatus.PENDING,
				supportedTradingPlatforms: [TradingPlatform.KUCOIN],
				estimatedProfit: 0,
				estimatedLoss: 0,
				candlestick: CandleStick.fifteenMin,
				risk: TradeRisk.low,
				category: Category.CRYPTO,
				originalBaseQuantity: 0.1,
				originalQuoteTotal: 6000,
				originalEstimatedLoss: 0,
				originalEstimatedProfit: 0,
			};

			const [createdMasterTradeOne, createdMasterTradeTwo, createdMasterTradeThree] =
				await Promise.all([
					tradeService.createMasterTrade(masterTradeInputOne),
					tradeService.createMasterTrade(masterTradeInputTwo),
					tradeService.createMasterTrade(masterTradeInputThree),
				]);

			expect(createdMasterTradeOne).toBeTruthy();
			expect(createdMasterTradeOne?.baseAsset).toBe("BTC");
			expect(createdMasterTradeOne?.pair).toBe("BTCUSDT");
			expect(createdMasterTradeOne?.status).toBe(TradeStatus.PENDING);
			expect(createdMasterTradeOne?.defaultTradingPlatform).toBe(TradingPlatform.BYBIT);

			expect(createdMasterTradeTwo).toBeTruthy();
			expect(createdMasterTradeTwo?.baseAsset).toBe("ETH");
			expect(createdMasterTradeTwo?.pair).toBe("ETHUSDT");
			expect(createdMasterTradeTwo?.status).toBe(TradeStatus.PENDING);
			expect(createdMasterTradeTwo?.defaultTradingPlatform).toBe(TradingPlatform.BINANCE);

			expect(createdMasterTradeThree).toBeTruthy();
			expect(createdMasterTradeThree?.baseAsset).toBe("BNB");
			expect(createdMasterTradeThree?.pair).toBe("BNBUSDT");
			expect(createdMasterTradeThree?.status).toBe(TradeStatus.PENDING);
			expect(createdMasterTradeThree?.defaultTradingPlatform).toBe(TradingPlatform.KUCOIN);
		});

		it("should throw error when required fields are missing for master trade", async () => {
			const invalidMasterTradeInput = {
				baseAsset: "BTC",
				// Missing required fields
			} as unknown as ICreateMasterTrade;

			await expect(tradeService.createMasterTrade(invalidMasterTradeInput)).rejects.toThrow();
		});
	});

	describe("processMasterTradesWithCandles", () => {
		describe("ACTIVE trades - PNL calculation", () => {
			it("should calculate positive PNL for LONG trade when price increases", async () => {
				// Create LONG trade with entry at 60000
				const trade = await MasterTrade.create({
					baseAsset: "BTC",
					baseAssetLogoUrl: "logo.png",
					quoteCurrency: "USDT",
					baseQuantity: 0.1,
					quoteTotal: 6000, // 60000 * 0.1
					currentPrice: 60000,
					entryPrice: 60000,
					stopLossPrice: 58000,
					takeProfitPrice: 65000,
					ordersTriggerPrice: 59500,
					targetOrdersAmountToFill: 100,
					pair: "BTCUSDT",
					side: TradeSide.LONG,
					status: TradeStatus.ACTIVE,
					supportedTradingPlatforms: [TradingPlatform.BINANCE],
					estimatedProfit: 500, // (65000 - 60000) * 0.1 = 500
					estimatedLoss: 200, // (60000 - 58000) * 0.1 = 200
					defaultTradingPlatform: TradingPlatform.BINANCE,
					candlestick: CandleStick.fifteenMin,
					risk: TradeRisk.low,
					category: Category.CRYPTO,
				});

				const ohlcData: IOHLCData[] = [
					{
						symbol: "BTCUSDT",
						open: "60000",
						high: "62000",
						low: "59500",
						close: "61200", // 2% increase
						openTime: Date.now(),
						closeTime: Date.now(),
						volume: "100",
					},
				];

				await tradeService.processMasterTradesWithCandles(ohlcData, [trade]);

				const updatedTrade = await MasterTrade.findById(trade._id);
				expect(updatedTrade?.currentPrice).toBe(61200);
				// pnlAmount = (61200 - 60000) * 0.1 = 120
				expect(updatedTrade?.pnl).toBeCloseTo(120, 2);
				// pnlPercentage = (120 / 200) * 100 = 60%
				expect(updatedTrade?.pnlPercentage).toBeCloseTo(60, 2);
			});

			it("should calculate negative PNL for LONG trade when price decreases", async () => {
				const trade = await MasterTrade.create({
					baseAsset: "BTC",
					baseAssetLogoUrl: "logo.png",
					quoteCurrency: "USDT",
					baseQuantity: 0.1,
					quoteTotal: 6000,
					currentPrice: 60000,
					entryPrice: 60000,
					stopLossPrice: 58000,
					takeProfitPrice: 65000,
					ordersTriggerPrice: 59500,
					targetOrdersAmountToFill: 100,
					pair: "BTCUSDT",
					side: TradeSide.LONG,
					status: TradeStatus.ACTIVE,
					supportedTradingPlatforms: [TradingPlatform.BINANCE],
					defaultTradingPlatform: TradingPlatform.BINANCE,
					estimatedProfit: 500,
					estimatedLoss: 200, // (60000 - 58000) * 0.1 = 200
					candlestick: CandleStick.fifteenMin,
					risk: TradeRisk.low,
					category: Category.CRYPTO,
				});

				const ohlcData: IOHLCData[] = [
					{
						symbol: "BTCUSDT",
						open: "60000",
						high: "60500",
						low: "58000",
						close: "58800", // -2% decrease
						openTime: Date.now(),
						closeTime: Date.now(),
						volume: "100",
					},
				];

				await tradeService.processMasterTradesWithCandles(ohlcData, [trade]);

				const updatedTrade = await MasterTrade.findById(trade._id);
				expect(updatedTrade?.currentPrice).toBe(58800);
				// pnlAmount = (58800 - 60000) * 0.1 = -120
				expect(updatedTrade?.pnl).toBeCloseTo(-120, 2);
				// pnlPercentage = (-120 / 200) * 100 = -60%
				expect(updatedTrade?.pnlPercentage).toBeCloseTo(-60, 2);
			});

			it("should calculate positive PNL for SHORT trade when price decreases", async () => {
				const trade = await MasterTrade.create({
					baseAsset: "BTC",
					baseAssetLogoUrl: "logo.png",
					quoteCurrency: "USDT",
					baseQuantity: 0.1,
					quoteTotal: 6000,
					currentPrice: 60000,
					entryPrice: 60000,
					stopLossPrice: 62000,
					takeProfitPrice: 55000,
					ordersTriggerPrice: 60500,
					targetOrdersAmountToFill: 100,
					pair: "BTCUSDT",
					side: TradeSide.SHORT,
					status: TradeStatus.ACTIVE,
					supportedTradingPlatforms: [TradingPlatform.BINANCE],
					estimatedProfit: 500, // (60000 - 55000) * 0.1 = 500
					estimatedLoss: 200, // (62000 - 60000) * 0.1 = 200
					defaultTradingPlatform: TradingPlatform.BINANCE,
					candlestick: CandleStick.fifteenMin,
					risk: TradeRisk.low,
					category: Category.CRYPTO,
				});

				const ohlcData: IOHLCData[] = [
					{
						symbol: "BTCUSDT",
						open: "60000",
						high: "60500",
						low: "58000",
						close: "58800", // -2% decrease = profit for SHORT
						openTime: Date.now(),
						closeTime: Date.now(),
						volume: "100",
					},
				];

				await tradeService.processMasterTradesWithCandles(ohlcData, [trade]);

				const updatedTrade = await MasterTrade.findById(trade._id);
				expect(updatedTrade?.currentPrice).toBe(58800);
				// pnlAmount = (60000 - 58800) * 0.1 = 120
				expect(updatedTrade?.pnl).toBeCloseTo(120, 2);
				// pnlPercentage = (120 / 200) * 100 = 60%
				expect(updatedTrade?.pnlPercentage).toBeCloseTo(60, 2);
			});

			it("should calculate negative PNL for SHORT trade when price increases", async () => {
				const trade = await MasterTrade.create({
					baseAsset: "BTC",
					baseAssetLogoUrl: "logo.png",
					quoteCurrency: "USDT",
					baseQuantity: 0.1,
					quoteTotal: 6000,
					currentPrice: 60000,
					entryPrice: 60000,
					stopLossPrice: 62000,
					takeProfitPrice: 55000,
					ordersTriggerPrice: 60500,
					targetOrdersAmountToFill: 100,
					pair: "BTCUSDT",
					side: TradeSide.SHORT,
					status: TradeStatus.ACTIVE,
					supportedTradingPlatforms: [TradingPlatform.BINANCE],
					estimatedProfit: 500,
					estimatedLoss: 200, // (62000 - 60000) * 0.1 = 200
					defaultTradingPlatform: TradingPlatform.BINANCE,
					candlestick: CandleStick.fifteenMin,
					risk: TradeRisk.low,
					category: Category.CRYPTO,
				});

				const ohlcData: IOHLCData[] = [
					{
						symbol: "BTCUSDT",
						open: "60000",
						high: "62000",
						low: "59500",
						close: "61200", // 2% increase = loss for SHORT
						openTime: Date.now(),
						closeTime: Date.now(),
						volume: "100",
					},
				];

				await tradeService.processMasterTradesWithCandles(ohlcData, [trade]);

				const updatedTrade = await MasterTrade.findById(trade._id);
				expect(updatedTrade?.currentPrice).toBe(61200);
				// pnlAmount = (60000 - 61200) * 0.1 = -120
				expect(updatedTrade?.pnl).toBeCloseTo(-120, 2);
				// pnlPercentage = (-120 / 200) * 100 = -60%
				expect(updatedTrade?.pnlPercentage).toBeCloseTo(-60, 2);
			});
		});

		describe("PENDING trades - Trigger activation", () => {
			beforeEach(() => {
				process.env.PROCESS_INCOMING_MASTER_TRADES_QUEUE = "test-queue-url";
			});

			it("should process LONG trade when low price reaches trigger", async () => {
				const trade = await MasterTrade.create({
					baseAsset: "BTC",
					baseAssetLogoUrl: "logo.png",
					quoteCurrency: "USDT",
					baseQuantity: 0.1,
					quoteTotal: 6000,
					currentPrice: 60000,
					entryPrice: 60000,
					stopLossPrice: 58000,
					takeProfitPrice: 65000,
					ordersTriggerPrice: 59500, // Trigger at 59500
					targetOrdersAmountToFill: 100,
					pair: "BTCUSDT",
					side: TradeSide.LONG,
					status: TradeStatus.PENDING,
					orderPlacementType: OrderPlacementType.LIMIT,
					accountType: AccountType.FUTURES,
					supportedTradingPlatforms: [TradingPlatform.BINANCE],
					estimatedProfit: 0,
					estimatedLoss: 0,
					defaultTradingPlatform: TradingPlatform.BINANCE,
					candlestick: CandleStick.fifteenMin,
					risk: TradeRisk.low,
					category: Category.CRYPTO,
				});

				const ohlcData: IOHLCData[] = [
					{
						symbol: "BTCUSDT",
						open: "60000",
						high: "60200",
						low: "59400", // Low reaches trigger
						close: "59800",
						openTime: Date.now(),
						closeTime: Date.now(),
						volume: "100",
					},
				];

				await tradeService.processMasterTradesWithCandles(ohlcData, [trade]);

				const updatedTrade = await MasterTrade.findById(trade._id);
				expect(updatedTrade?.status).toBe(TradeStatus.PROCESSING);
				expect(updatedTrade?.pnl).toBe(0);
				expect(updatedTrade?.pnlPercentage).toBe(0);
				expect(updatedTrade?.currentPrice).toBe(59800);

				// Verify queue message was sent
				expect(mockPublishMessageToQueue).toHaveBeenCalledWith({
					queueUrl: "test-queue-url",
					message: expect.stringContaining(trade.id as string),
				});
			});

			it("should process SHORT trade when high price reaches trigger", async () => {
				const trade = await MasterTrade.create({
					baseAsset: "BTC",
					baseAssetLogoUrl: "logo.png",
					quoteCurrency: "USDT",
					baseQuantity: 0.1,
					quoteTotal: 6000,
					currentPrice: 60000,
					entryPrice: 60000,
					stopLossPrice: 62000,
					takeProfitPrice: 55000,
					ordersTriggerPrice: 60500, // Trigger at 60500
					targetOrdersAmountToFill: 100,
					pair: "BTCUSDT",
					side: TradeSide.SHORT,
					status: TradeStatus.PENDING,
					orderPlacementType: OrderPlacementType.LIMIT,
					accountType: AccountType.FUTURES,
					supportedTradingPlatforms: [TradingPlatform.BINANCE],
					estimatedProfit: 0,
					estimatedLoss: 0,
					defaultTradingPlatform: TradingPlatform.BINANCE,
					candlestick: CandleStick.fifteenMin,
					risk: TradeRisk.low,
					category: Category.CRYPTO,
				});

				const ohlcData: IOHLCData[] = [
					{
						symbol: "BTCUSDT",
						open: "60000",
						high: "60600", // High reaches trigger
						low: "59800",
						close: "60200",
						openTime: Date.now(),
						closeTime: Date.now(),
						volume: "100",
					},
				];

				await tradeService.processMasterTradesWithCandles(ohlcData, [trade]);

				const updatedTrade = await MasterTrade.findById(trade._id);
				expect(updatedTrade?.status).toBe(TradeStatus.PROCESSING);
				expect(updatedTrade?.currentPrice).toBe(60200);

				expect(mockPublishMessageToQueue).toHaveBeenCalledTimes(1);
			});

			it("should NOT activate LONG trade when trigger is not reached", async () => {
				const trade = await MasterTrade.create({
					baseAsset: "BTC",
					baseAssetLogoUrl: "logo.png",
					quoteCurrency: "USDT",
					baseQuantity: 0.1,
					quoteTotal: 6000,
					currentPrice: 60000,
					entryPrice: 60000,
					stopLossPrice: 58000,
					takeProfitPrice: 65000,
					ordersTriggerPrice: 59500, // Trigger at 59500
					targetOrdersAmountToFill: 100,
					pair: "BTCUSDT",
					side: TradeSide.LONG,
					status: TradeStatus.PENDING,
					supportedTradingPlatforms: [TradingPlatform.BINANCE],
					estimatedProfit: 0,
					estimatedLoss: 0,
					defaultTradingPlatform: TradingPlatform.BINANCE,
					candlestick: CandleStick.fifteenMin,
					risk: TradeRisk.low,
					category: Category.CRYPTO,
				});

				const ohlcData: IOHLCData[] = [
					{
						symbol: "BTCUSDT",
						open: "60000",
						high: "60500",
						low: "59600", // Low does NOT reach trigger (59500)
						close: "60200",
						openTime: Date.now(),
						closeTime: Date.now(),
						volume: "100",
					},
				];

				await tradeService.processMasterTradesWithCandles(ohlcData, [trade]);

				const updatedTrade = await MasterTrade.findById(trade._id);
				expect(updatedTrade?.status).toBe(TradeStatus.PENDING);
				expect(mockPublishMessageToQueue).not.toHaveBeenCalled();
			});

			it("should NOT activate SHORT trade when trigger is not reached", async () => {
				const trade = await MasterTrade.create({
					baseAsset: "BTC",
					baseAssetLogoUrl: "logo.png",
					quoteCurrency: "USDT",
					baseQuantity: 0.1,
					quoteTotal: 6000,
					currentPrice: 60000,
					entryPrice: 60000,
					stopLossPrice: 62000,
					takeProfitPrice: 55000,
					ordersTriggerPrice: 60500, // Trigger at 60500
					targetOrdersAmountToFill: 100,
					pair: "BTCUSDT",
					side: TradeSide.SHORT,
					status: TradeStatus.PENDING,
					supportedTradingPlatforms: [TradingPlatform.BINANCE],
					estimatedProfit: 0,
					estimatedLoss: 0,
					defaultTradingPlatform: TradingPlatform.BINANCE,
					candlestick: CandleStick.fifteenMin,
					risk: TradeRisk.low,
					category: Category.CRYPTO,
				});

				const ohlcData: IOHLCData[] = [
					{
						symbol: "BTCUSDT",
						open: "60000",
						high: "60400", // High does NOT reach trigger (60500)
						low: "59800",
						close: "60200",
						openTime: Date.now(),
						closeTime: Date.now(),
						volume: "100",
					},
				];

				await tradeService.processMasterTradesWithCandles(ohlcData, [trade]);

				const updatedTrade = await MasterTrade.findById(trade._id);
				expect(updatedTrade?.status).toBe(TradeStatus.PENDING);
				expect(mockPublishMessageToQueue).not.toHaveBeenCalled();
			});
		});

		describe("Edge cases and error handling", () => {
			it("should handle missing candle data gracefully", async () => {
				const trade = await MasterTrade.create({
					baseAsset: "BTC",
					baseAssetLogoUrl: "logo.png",
					quoteCurrency: "USDT",
					baseQuantity: 0.1,
					quoteTotal: 6000,
					currentPrice: 60000,
					entryPrice: 60000,
					stopLossPrice: 58000,
					takeProfitPrice: 65000,
					ordersTriggerPrice: 59500,
					targetOrdersAmountToFill: 100,
					pair: "BTCUSDT",
					side: TradeSide.LONG,
					status: TradeStatus.ACTIVE,
					supportedTradingPlatforms: [TradingPlatform.BINANCE],
					estimatedProfit: 0,
					estimatedLoss: 0,
					defaultTradingPlatform: TradingPlatform.BINANCE,
					candlestick: CandleStick.fifteenMin,
					risk: TradeRisk.low,
					category: Category.CRYPTO,
				});

				const ohlcData: IOHLCData[] = [
					{
						symbol: "ETHUSDT", // Different pair - no matching data
						open: "3000",
						high: "3100",
						low: "2900",
						close: "3050",
						openTime: Date.now(),
						closeTime: Date.now(),
						volume: "1000",
					},
				];

				await tradeService.processMasterTradesWithCandles(ohlcData, [trade]);

				// Trade should remain unchanged
				const updatedTrade = await MasterTrade.findById(trade._id);
				expect(updatedTrade?.currentPrice).toBe(60000); // Original price
			});

			it("should process multiple trades with different pairs", async () => {
				const btcTrade = await MasterTrade.create({
					baseAsset: "BTC",
					baseAssetLogoUrl: "logo.png",
					quoteCurrency: "USDT",
					baseQuantity: 0.1,
					quoteTotal: 6000,
					currentPrice: 60000,
					entryPrice: 60000,
					stopLossPrice: 58000,
					takeProfitPrice: 65000,
					ordersTriggerPrice: 59500,
					targetOrdersAmountToFill: 100,
					pair: "BTCUSDT",
					side: TradeSide.LONG,
					status: TradeStatus.ACTIVE,
					supportedTradingPlatforms: [TradingPlatform.BINANCE],
					estimatedProfit: 500,
					estimatedLoss: 200,
					defaultTradingPlatform: TradingPlatform.BINANCE,
					candlestick: CandleStick.fifteenMin,
					risk: TradeRisk.low,
					category: Category.CRYPTO,
				});

				const ethTrade = await MasterTrade.create({
					baseAsset: "ETH",
					baseAssetLogoUrl: "logo.png",
					quoteCurrency: "USDT",
					baseQuantity: 1,
					quoteTotal: 3000,
					currentPrice: 3000,
					entryPrice: 3000,
					stopLossPrice: 2900,
					takeProfitPrice: 3200,
					ordersTriggerPrice: 2950,
					targetOrdersAmountToFill: 100,
					pair: "ETHUSDT",
					side: TradeSide.SHORT,
					status: TradeStatus.ACTIVE,
					supportedTradingPlatforms: [TradingPlatform.BINANCE],
					estimatedProfit: 200, // (3000 - 2800) * 1 = 200
					estimatedLoss: 100, // (3100 - 3000) * 1 = 100
					defaultTradingPlatform: TradingPlatform.BINANCE,
					candlestick: CandleStick.fifteenMin,
					risk: TradeRisk.low,
					category: Category.CRYPTO,
				});

				const ohlcData: IOHLCData[] = [
					{
						symbol: "BTCUSDT",
						open: "60000",
						high: "61000",
						low: "59500",
						close: "60600", // 1% profit for LONG
						openTime: Date.now(),
						closeTime: Date.now(),
						volume: "100",
					},
					{
						symbol: "ETHUSDT",
						open: "3000",
						high: "3050",
						low: "2950",
						close: "2970", // 1% profit for SHORT
						openTime: Date.now(),
						closeTime: Date.now(),
						volume: "1000",
					},
				];

				await tradeService.processMasterTradesWithCandles(ohlcData, [btcTrade, ethTrade]);

				const updatedBtcTrade = await MasterTrade.findById(btcTrade._id);
				const updatedEthTrade = await MasterTrade.findById(ethTrade._id);

				expect(updatedBtcTrade?.currentPrice).toBe(60600);
				// BTC: pnlAmount = (60600 - 60000) * 0.1 = 60
				expect(updatedBtcTrade?.pnl).toBeCloseTo(60, 2);
				// BTC: pnlPercentage = (60 / 200) * 100 = 30%
				expect(updatedBtcTrade?.pnlPercentage).toBeCloseTo(30, 2);

				expect(updatedEthTrade?.currentPrice).toBe(2970);
				// ETH: pnlAmount = (3000 - 2970) * 1 = 30
				expect(updatedEthTrade?.pnl).toBeCloseTo(30, 2);
				// ETH: pnlPercentage = (30 / 100) * 100 = 30%
				expect(updatedEthTrade?.pnlPercentage).toBeCloseTo(30, 2);
			});

			it("should handle empty trades array", async () => {
				const ohlcData: IOHLCData[] = [
					{
						symbol: "BTCUSDT",
						open: "60000",
						high: "61000",
						low: "59500",
						close: "60600",
						openTime: Date.now(),
						closeTime: Date.now(),
						volume: "100",
					},
				];

				await expect(
					tradeService.processMasterTradesWithCandles(ohlcData, [])
				).resolves.not.toThrow();
			});
		});
	});

	describe("PROCESSED trades - Entry price activation", () => {
		it("should activate LONG trade when low price reaches entry price", async () => {
			const trade = await MasterTrade.create({
				baseAsset: "BTC",
				baseAssetLogoUrl: "logo.png",
				quoteCurrency: "USDT",
				baseQuantity: 0.1,
				quoteTotal: 6000,
				currentPrice: 60000,
				entryPrice: 59800, // Entry price
				stopLossPrice: 58000,
				takeProfitPrice: 65000,
				ordersTriggerPrice: 59500,
				targetOrdersAmountToFill: 100,
				pair: "BTCUSDT",
				side: TradeSide.LONG,
				status: TradeStatus.PROCESSED,
				orderPlacementType: OrderPlacementType.LIMIT,
				accountType: AccountType.FUTURES,
				supportedTradingPlatforms: [TradingPlatform.BINANCE],
				estimatedProfit: 0,
				estimatedLoss: 0,
				defaultTradingPlatform: TradingPlatform.BINANCE,
				candlestick: CandleStick.fifteenMin,
				risk: TradeRisk.low,
				category: Category.CRYPTO,
			});

			const ohlcData: IOHLCData[] = [
				{
					symbol: "BTCUSDT",
					open: "60000",
					high: "60200",
					low: "59700", // Low reaches entry price (59800)
					close: "59900",
					openTime: Date.now(),
					closeTime: Date.now(),
					volume: "100",
				},
			];

			await tradeService.processMasterTradesWithCandles(ohlcData, [trade]);

			const updatedTrade = await MasterTrade.findById(trade._id);
			expect(updatedTrade?.status).toBe(TradeStatus.ACTIVE);
			expect(updatedTrade?.pnl).toBe(0);
			expect(updatedTrade?.pnlPercentage).toBe(0);
			expect(updatedTrade?.currentPrice).toBe(59900);

			// Should NOT publish to queue (it's commented out in the implementation)
			expect(mockPublishMessageToQueue).not.toHaveBeenCalled();
		});

		it("should activate SHORT trade when high price reaches entry price", async () => {
			const trade = await MasterTrade.create({
				baseAsset: "BTC",
				baseAssetLogoUrl: "logo.png",
				quoteCurrency: "USDT",
				baseQuantity: 0.1,
				quoteTotal: 6000,
				currentPrice: 60000,
				entryPrice: 60200, // Entry price
				stopLossPrice: 62000,
				takeProfitPrice: 55000,
				ordersTriggerPrice: 60500,
				targetOrdersAmountToFill: 100,
				pair: "BTCUSDT",
				side: TradeSide.SHORT,
				status: TradeStatus.PROCESSED,
				orderPlacementType: OrderPlacementType.LIMIT,
				accountType: AccountType.FUTURES,
				supportedTradingPlatforms: [TradingPlatform.BINANCE],
				estimatedProfit: 0,
				estimatedLoss: 0,
				defaultTradingPlatform: TradingPlatform.BINANCE,
				candlestick: CandleStick.fifteenMin,
				risk: TradeRisk.low,
				category: Category.CRYPTO,
			});

			const ohlcData: IOHLCData[] = [
				{
					symbol: "BTCUSDT",
					open: "60000",
					high: "60300", // High reaches entry price (60200)
					low: "59800",
					close: "60100",
					openTime: Date.now(),
					closeTime: Date.now(),
					volume: "100",
				},
			];

			await tradeService.processMasterTradesWithCandles(ohlcData, [trade]);

			const updatedTrade = await MasterTrade.findById(trade._id);
			expect(updatedTrade?.status).toBe(TradeStatus.ACTIVE);
			expect(updatedTrade?.currentPrice).toBe(60100);
			expect(updatedTrade?.pnl).toBe(0);
			expect(updatedTrade?.pnlPercentage).toBe(0);

			expect(mockPublishMessageToQueue).not.toHaveBeenCalled();
		});

		it("should NOT activate LONG trade when entry price is not reached", async () => {
			const trade = await MasterTrade.create({
				baseAsset: "BTC",
				baseAssetLogoUrl: "logo.png",
				quoteCurrency: "USDT",
				baseQuantity: 0.1,
				quoteTotal: 6000,
				currentPrice: 60000,
				entryPrice: 59800, // Entry price
				stopLossPrice: 58000,
				takeProfitPrice: 65000,
				ordersTriggerPrice: 59500,
				targetOrdersAmountToFill: 100,
				pair: "BTCUSDT",
				side: TradeSide.LONG,
				status: TradeStatus.PROCESSED,
				supportedTradingPlatforms: [TradingPlatform.BINANCE],
				estimatedProfit: 0,
				estimatedLoss: 0,
				defaultTradingPlatform: TradingPlatform.BINANCE,
				candlestick: CandleStick.fifteenMin,
				risk: TradeRisk.low,
				category: Category.CRYPTO,
			});

			const ohlcData: IOHLCData[] = [
				{
					symbol: "BTCUSDT",
					open: "60000",
					high: "60500",
					low: "59900", // Low does NOT reach entry price (59800)
					close: "60200",
					openTime: Date.now(),
					closeTime: Date.now(),
					volume: "100",
				},
			];

			await tradeService.processMasterTradesWithCandles(ohlcData, [trade]);

			const updatedTrade = await MasterTrade.findById(trade._id);
			expect(updatedTrade?.status).toBe(TradeStatus.PROCESSED);
			expect(mockPublishMessageToQueue).not.toHaveBeenCalled();
		});

		it("should NOT activate SHORT trade when entry price is not reached", async () => {
			const trade = await MasterTrade.create({
				baseAsset: "BTC",
				baseAssetLogoUrl: "logo.png",
				quoteCurrency: "USDT",
				baseQuantity: 0.1,
				quoteTotal: 6000,
				currentPrice: 60000,
				entryPrice: 60200, // Entry price
				stopLossPrice: 62000,
				takeProfitPrice: 55000,
				ordersTriggerPrice: 60500,
				targetOrdersAmountToFill: 100,
				pair: "BTCUSDT",
				side: TradeSide.SHORT,
				status: TradeStatus.PROCESSED,
				supportedTradingPlatforms: [TradingPlatform.BINANCE],
				estimatedProfit: 0,
				estimatedLoss: 0,
				defaultTradingPlatform: TradingPlatform.BINANCE,
				candlestick: CandleStick.fifteenMin,
				risk: TradeRisk.low,
				category: Category.CRYPTO,
			});

			const ohlcData: IOHLCData[] = [
				{
					symbol: "BTCUSDT",
					open: "60000",
					high: "60100", // High does NOT reach entry price (60200)
					low: "59800",
					close: "60000",
					openTime: Date.now(),
					closeTime: Date.now(),
					volume: "100",
				},
			];

			await tradeService.processMasterTradesWithCandles(ohlcData, [trade]);

			const updatedTrade = await MasterTrade.findById(trade._id);
			expect(updatedTrade?.status).toBe(TradeStatus.PROCESSED);
			expect(mockPublishMessageToQueue).not.toHaveBeenCalled();
		});

		it("should handle transition from PROCESSED to ACTIVE correctly", async () => {
			const trade = await MasterTrade.create({
				baseAsset: "BTC",
				baseAssetLogoUrl: "logo.png",
				quoteCurrency: "USDT",
				baseQuantity: 0.1,
				quoteTotal: 6000,
				currentPrice: 60000,
				entryPrice: 60000,
				stopLossPrice: 58000,
				takeProfitPrice: 65000,
				ordersTriggerPrice: 59500,
				targetOrdersAmountToFill: 100,
				pair: "BTCUSDT",
				side: TradeSide.LONG,
				status: TradeStatus.PROCESSED,
				supportedTradingPlatforms: [TradingPlatform.BINANCE],
				estimatedProfit: 500,
				estimatedLoss: 200,
				defaultTradingPlatform: TradingPlatform.BINANCE,
				candlestick: CandleStick.fifteenMin,
				risk: TradeRisk.low,
				category: Category.CRYPTO,
			});

			// First candle - entry price reached, should activate
			const ohlcData1: IOHLCData[] = [
				{
					symbol: "BTCUSDT",
					open: "60200",
					high: "60300",
					low: "59900", // Reaches entry price
					close: "60100",
					openTime: Date.now(),
					closeTime: Date.now(),
					volume: "100",
				},
			];

			await tradeService.processMasterTradesWithCandles(ohlcData1, [trade]);

			let updatedTrade = await MasterTrade.findById(trade._id);
			expect(updatedTrade?.status).toBe(TradeStatus.ACTIVE);

			// Second candle - now as ACTIVE trade, should calculate PNL
			const ohlcData2: IOHLCData[] = [
				{
					symbol: "BTCUSDT",
					open: "60100",
					high: "61000",
					low: "60000",
					close: "60600", // 1% gain
					openTime: Date.now(),
					closeTime: Date.now(),
					volume: "100",
				},
			];

			await tradeService.processMasterTradesWithCandles(ohlcData2, [
				updatedTrade as IMasterTrade,
			]);

			updatedTrade = await MasterTrade.findById(trade._id);
			expect(updatedTrade?.status).toBe(TradeStatus.ACTIVE);
			expect(updatedTrade?.currentPrice).toBe(60600);
			// pnlAmount = (60600 - 60000) * 0.1 = 60
			expect(updatedTrade?.pnl).toBeCloseTo(60, 2);
			// pnlPercentage = (60 / 200) * 100 = 30%
			expect(updatedTrade?.pnlPercentage).toBeCloseTo(30, 2);
		});
	});

	describe("setMasterTradeStopLossOrTakeProfit", () => {
		beforeEach(() => {
			// Set up environment variables - match mapTradingPlatformToQueueUrl exactly
			process.env.PROCESS_BYBIT_ORDERS_ACTIVATION_QUEUE = "https://sqs.test.bybit-activation";
			process.env.PROCESS_BYBIT_STOP_LOSS_ORDERS_QUEUE = "https://sqs.test.bybit-sl";
			process.env.PROCESS_BYBIT_TAKE_PROFIT_ORDERS_QUEUE = "https://sqs.test.bybit-tp";
			process.env.PROCESS_BYBIT_CLOSE_TRADES_QUEUE = "https://sqs.test.bybit-close";
			process.env.PROCESS_BYBIT_CANCEL_ORDERS_QUEUE = "https://sqs.test.bybit-cancel";
		});

		it("should update both stop loss and take profit prices", async () => {
			const trade = await MasterTrade.create({
				baseAsset: "BTC",
				baseAssetLogoUrl: "logo.png",
				quoteCurrency: "USDT",
				baseQuantity: 0.1,
				quoteTotal: 6000,
				currentPrice: 60000,
				entryPrice: 60000,
				stopLossPrice: 58000,
				takeProfitPrice: 65000,
				ordersTriggerPrice: 59500,
				targetOrdersAmountToFill: 100,
				pair: "BTCUSDT",
				side: TradeSide.LONG,
				status: TradeStatus.ACTIVE,
				supportedTradingPlatforms: [TradingPlatform.BYBIT],
				estimatedProfit: 500,
				estimatedLoss: 200,
				defaultTradingPlatform: TradingPlatform.BYBIT,
				candlestick: CandleStick.fifteenMin,
				risk: TradeRisk.low,
				category: Category.CRYPTO,
			});

			// Create user trade with platformName
			await Trade.create({
				userId: "test-user-123",
				masterTradeId: (trade._id as any).toString(),
				baseAsset: "BTC",
				baseQuantity: 0.1,
				entryPrice: 60000,
				stopLossPrice: 58000,
				takeProfitPrice: 65000,
				quoteCurrency: "USDT",
				quoteTotal: 6000,
				pair: "BTCUSDT",
				side: TradeSide.LONG,
				status: TradeStatus.ACTIVE,
				platformName: TradingPlatform.BYBIT,
				estimatedProfit: 500,
				estimatedLoss: 200,
			});

			await tradeService.setMasterTradeStopLossOrTakeProfit({
				masterTradeId: (trade._id as any).toString(),
				stopLossPrice: 57000,
				takeProfitPrice: 66000,
			});

			const updatedTrade = await MasterTrade.findById(trade._id);
			expect(updatedTrade?.stopLossPrice).toBe(57000);
			expect(updatedTrade?.takeProfitPrice).toBe(66000);

			// Should publish to both SL and TP queues
			expect(mockPublishMessageToQueue).toHaveBeenCalledTimes(2);

			// Verify SL message
			const slCall = mockPublishMessageToQueue.mock.calls[0][0];
			expect(slCall.queueUrl).toBe("https://sqs.test.bybit-sl");
			const slMessage = JSON.parse(slCall.message);
			expect(slMessage.stopLossPrice).toBe(57000);

			// Verify TP message
			const tpCall = mockPublishMessageToQueue.mock.calls[1][0];
			expect(tpCall.queueUrl).toBe("https://sqs.test.bybit-tp");
			const tpMessage = JSON.parse(tpCall.message);
			expect(tpMessage.takeProfitPrice).toBe(66000);
		});

		it("should remove take profit price when not provided and exists in DB", async () => {
			const trade = await MasterTrade.create({
				baseAsset: "BTC",
				baseAssetLogoUrl: "logo.png",
				quoteCurrency: "USDT",
				baseQuantity: 0.1,
				quoteTotal: 6000,
				currentPrice: 60000,
				entryPrice: 60000,
				stopLossPrice: 58000,
				takeProfitPrice: 65000,
				ordersTriggerPrice: 59500,
				targetOrdersAmountToFill: 100,
				pair: "BTCUSDT",
				side: TradeSide.LONG,
				status: TradeStatus.ACTIVE,
				supportedTradingPlatforms: [TradingPlatform.BYBIT],
				estimatedProfit: 500,
				estimatedLoss: 200,
				defaultTradingPlatform: TradingPlatform.BYBIT,
				candlestick: CandleStick.fifteenMin,
				risk: TradeRisk.low,
				category: Category.CRYPTO,
			});

			// Create user trade with platformName
			await Trade.create({
				userId: "test-user-123",
				masterTradeId: (trade._id as any).toString(),
				baseAsset: "BTC",
				baseQuantity: 0.1,
				entryPrice: 60000,
				stopLossPrice: 58000,
				takeProfitPrice: 65000,
				quoteCurrency: "USDT",
				quoteTotal: 6000,
				pair: "BTCUSDT",
				side: TradeSide.LONG,
				status: TradeStatus.ACTIVE,
				platformName: TradingPlatform.BYBIT,
				estimatedProfit: 500,
				estimatedLoss: 200,
			});

			// Update SL only, TP should be removed since it's not provided
			await tradeService.setMasterTradeStopLossOrTakeProfit({
				masterTradeId: (trade._id as any).toString(),
				stopLossPrice: 57000,
				// takeProfitPrice omitted
			});

			const updatedTrade = await MasterTrade.findById(trade._id);
			expect(updatedTrade?.stopLossPrice).toBe(57000);
			expect(updatedTrade?.takeProfitPrice).toBeUndefined();

			// Should publish to SL queue (1 call for SL) + TP queue with undefined (1 call for TP removal)
			expect(mockPublishMessageToQueue).toHaveBeenCalledTimes(2);

			// Verify TP removal message
			const tpCall = mockPublishMessageToQueue.mock.calls[1][0];
			expect(tpCall.queueUrl).toBe("https://sqs.test.bybit-tp");
			const tpMessage = JSON.parse(tpCall.message);
			expect(tpMessage.takeProfitPrice).toBeUndefined();
		});

		it("should not publish if SL price unchanged", async () => {
			const trade = await MasterTrade.create({
				baseAsset: "BTC",
				baseAssetLogoUrl: "logo.png",
				quoteCurrency: "USDT",
				baseQuantity: 0.1,
				quoteTotal: 6000,
				currentPrice: 60000,
				entryPrice: 60000,
				stopLossPrice: 58000,
				takeProfitPrice: 65000,
				ordersTriggerPrice: 59500,
				targetOrdersAmountToFill: 100,
				pair: "BTCUSDT",
				side: TradeSide.LONG,
				status: TradeStatus.ACTIVE,
				supportedTradingPlatforms: [TradingPlatform.BYBIT],
				estimatedProfit: 500,
				estimatedLoss: 200,
				defaultTradingPlatform: TradingPlatform.BYBIT,
				candlestick: CandleStick.fifteenMin,
				risk: TradeRisk.low,
				category: Category.CRYPTO,
			});

			await Trade.create({
				userId: "test-user-123",
				masterTradeId: (trade._id as any).toString(),
				baseAsset: "BTC",
				baseQuantity: 0.1,
				entryPrice: 60000,
				stopLossPrice: 58000,
				takeProfitPrice: 65000,
				quoteCurrency: "USDT",
				quoteTotal: 6000,
				pair: "BTCUSDT",
				side: TradeSide.LONG,
				status: TradeStatus.ACTIVE,
				platformName: TradingPlatform.BYBIT,
				estimatedProfit: 500,
				estimatedLoss: 200,
			});

			// Update with same SL price
			await tradeService.setMasterTradeStopLossOrTakeProfit({
				masterTradeId: (trade._id as any).toString(),
				stopLossPrice: 58000, // Same as current
				takeProfitPrice: 66000, // Different
			});

			// Should only publish TP queue (not SL since price unchanged)
			expect(mockPublishMessageToQueue).toHaveBeenCalledTimes(1);
			const tpCall = mockPublishMessageToQueue.mock.calls[0][0];
			expect(tpCall.queueUrl).toBe("https://sqs.test.bybit-tp");
		});

		it("should throw error when updating non-active trade", async () => {
			const trade = await MasterTrade.create({
				baseAsset: "BTC",
				baseAssetLogoUrl: "logo.png",
				quoteCurrency: "USDT",
				baseQuantity: 0.1,
				quoteTotal: 6000,
				currentPrice: 60000,
				entryPrice: 60000,
				stopLossPrice: 58000,
				takeProfitPrice: 65000,
				ordersTriggerPrice: 59500,
				targetOrdersAmountToFill: 100,
				pair: "BTCUSDT",
				side: TradeSide.LONG,
				status: TradeStatus.PENDING,
				supportedTradingPlatforms: [TradingPlatform.BYBIT],
				estimatedProfit: 0,
				estimatedLoss: 0,
				defaultTradingPlatform: TradingPlatform.BYBIT,
				candlestick: CandleStick.fifteenMin,
				risk: TradeRisk.low,
				category: Category.CRYPTO,
			});

			await expect(
				tradeService.setMasterTradeStopLossOrTakeProfit({
					masterTradeId: (trade._id as any).toString(),
					stopLossPrice: 57000,
				})
			).rejects.toThrow();
		});
	});

	describe("closeActiveMasterTrade", () => {
		it("should close active trade with 100% quantity", async () => {
			const trade = await MasterTrade.create({
				baseAsset: "BTC",
				baseAssetLogoUrl: "logo.png",
				quoteCurrency: "USDT",
				baseQuantity: 0.1,
				quoteTotal: 6000,
				currentPrice: 60000,
				entryPrice: 60000,
				stopLossPrice: 58000,
				takeProfitPrice: 65000,
				ordersTriggerPrice: 59500,
				targetOrdersAmountToFill: 100,
				pair: "BTCUSDT",
				side: TradeSide.LONG,
				status: TradeStatus.ACTIVE,
				supportedTradingPlatforms: [TradingPlatform.BINANCE],
				estimatedProfit: 500,
				estimatedLoss: 200,
				defaultTradingPlatform: TradingPlatform.BINANCE,
				candlestick: CandleStick.fifteenMin,
				risk: TradeRisk.low,
				category: Category.CRYPTO,
			});

			await tradeService.closeActiveMasterTrade({
				masterTradeId: (trade._id as any).toString(),
				qtyPercentToClose: 100,
			});

			const updatedTrade = await MasterTrade.findById(trade._id);
			expect(updatedTrade?.status).toBe(TradeStatus.CLOSED);
		});

		it("should close active trade with 50% quantity (partial close)", async () => {
			const trade = await MasterTrade.create({
				baseAsset: "BTC",
				baseAssetLogoUrl: "logo.png",
				quoteCurrency: "USDT",
				baseQuantity: 1,
				quoteTotal: 60000,
				currentPrice: 60000,
				entryPrice: 60000,
				stopLossPrice: 58000,
				takeProfitPrice: 65000,
				ordersTriggerPrice: 59500,
				targetOrdersAmountToFill: 100,
				pair: "BTCUSDT",
				side: TradeSide.LONG,
				status: TradeStatus.ACTIVE,
				supportedTradingPlatforms: [TradingPlatform.BINANCE],
				estimatedProfit: 5000,
				estimatedLoss: 2000,
				defaultTradingPlatform: TradingPlatform.BINANCE,
				candlestick: CandleStick.fifteenMin,
				risk: TradeRisk.low,
				category: Category.CRYPTO,
			});

			await tradeService.closeActiveMasterTrade({
				masterTradeId: (trade._id as any).toString(),
				qtyPercentToClose: 50,
			});

			const updatedTrade = await MasterTrade.findById(trade._id);
			expect(updatedTrade?.baseQuantity).toBe(0.5);
			expect(updatedTrade?.quoteTotal).toBe(30000);
			expect(updatedTrade?.status).toBe(TradeStatus.BREAK_EVEN);
		});
	});

	describe("breakEvenActiveMasterTrade", () => {
		it("should move stop loss to entry price and close 50% of position", async () => {
			const trade = await MasterTrade.create({
				baseAsset: "BTC",
				baseAssetLogoUrl: "logo.png",
				quoteCurrency: "USDT",
				baseQuantity: 1,
				quoteTotal: 60000,
				currentPrice: 61000,
				entryPrice: 60000,
				stopLossPrice: 58000,
				takeProfitPrice: 65000,
				ordersTriggerPrice: 59500,
				targetOrdersAmountToFill: 100,
				pair: "BTCUSDT",
				side: TradeSide.LONG,
				status: TradeStatus.ACTIVE,
				supportedTradingPlatforms: [TradingPlatform.BINANCE],
				estimatedProfit: 5000,
				estimatedLoss: 2000,
				defaultTradingPlatform: TradingPlatform.BINANCE,
				candlestick: CandleStick.fifteenMin,
				risk: TradeRisk.low,
				category: Category.CRYPTO,
			});

			await tradeService.breakEvenActiveMasterTrade((trade._id as any).toString());

			const updatedTrade = await MasterTrade.findById(trade._id);
			expect(updatedTrade?.stopLossPrice).toBe(60000); // Entry price
			expect(updatedTrade?.baseQuantity).toBe(0.5); // 50% closed
			expect(updatedTrade?.status).toBe(TradeStatus.BREAK_EVEN);
		});
	});

	describe("triggerMasterTradeOrdersPlacement", () => {
		it("should trigger orders placement for pending trade", async () => {
			process.env.PROCESS_INCOMING_MASTER_TRADES_QUEUE = "test-queue-url";

			const trade = await MasterTrade.create({
				baseAsset: "BTC",
				baseAssetLogoUrl: "logo.png",
				quoteCurrency: "USDT",
				baseQuantity: 0.1,
				quoteTotal: 6000,
				currentPrice: 60000,
				entryPrice: 60000,
				stopLossPrice: 58000,
				takeProfitPrice: 65000,
				ordersTriggerPrice: 59500,
				targetOrdersAmountToFill: 100,
				pair: "BTCUSDT",
				side: TradeSide.LONG,
				status: TradeStatus.PENDING,
				supportedTradingPlatforms: [TradingPlatform.BINANCE],
				estimatedProfit: 0,
				estimatedLoss: 0,
				defaultTradingPlatform: TradingPlatform.BINANCE,
				candlestick: CandleStick.fifteenMin,
				risk: TradeRisk.low,
				category: Category.CRYPTO,
			});

			await tradeService.triggerMasterTradeOrdersPlacement((trade._id as any).toString());

			const updatedTrade = await MasterTrade.findById(trade._id);
			expect(updatedTrade?.status).toBe(TradeStatus.PROCESSING);
			expect(mockPublishMessageToQueue).toHaveBeenCalled();
		});
	});

	describe("cancelNoneActiveMasterTrade", () => {
		it("should cancel pending trade", async () => {
			const trade = await MasterTrade.create({
				baseAsset: "BTC",
				baseAssetLogoUrl: "logo.png",
				quoteCurrency: "USDT",
				baseQuantity: 0.1,
				quoteTotal: 6000,
				currentPrice: 60000,
				entryPrice: 60000,
				stopLossPrice: 58000,
				takeProfitPrice: 65000,
				ordersTriggerPrice: 59500,
				targetOrdersAmountToFill: 100,
				pair: "BTCUSDT",
				side: TradeSide.LONG,
				status: TradeStatus.PENDING,
				supportedTradingPlatforms: [TradingPlatform.BINANCE],
				estimatedProfit: 0,
				estimatedLoss: 0,
				defaultTradingPlatform: TradingPlatform.BINANCE,
				candlestick: CandleStick.fifteenMin,
				risk: TradeRisk.low,
				category: Category.CRYPTO,
			});

			await tradeService.cancelNoneActiveMasterTrade((trade._id as any).toString());

			const updatedTrade = await MasterTrade.findById(trade._id);
			expect(updatedTrade?.status).toBe(TradeStatus.CANCELED);
		});

		it("should throw error when trying to cancel active trade", async () => {
			const trade = await MasterTrade.create({
				baseAsset: "BTC",
				baseAssetLogoUrl: "logo.png",
				quoteCurrency: "USDT",
				baseQuantity: 0.1,
				quoteTotal: 6000,
				currentPrice: 60000,
				entryPrice: 60000,
				stopLossPrice: 58000,
				takeProfitPrice: 65000,
				ordersTriggerPrice: 59500,
				targetOrdersAmountToFill: 100,
				pair: "BTCUSDT",
				side: TradeSide.LONG,
				status: TradeStatus.ACTIVE,
				supportedTradingPlatforms: [TradingPlatform.BINANCE],
				estimatedProfit: 500,
				estimatedLoss: 200,
				defaultTradingPlatform: TradingPlatform.BINANCE,
				candlestick: CandleStick.fifteenMin,
				risk: TradeRisk.low,
				category: Category.CRYPTO,
			});

			await expect(
				tradeService.cancelNoneActiveMasterTrade((trade._id as any).toString())
			).rejects.toThrow();
		});
	});
});
