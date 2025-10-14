import { TradeService } from "./index";
import { ICreateMasterTrade, MasterTrade } from "../../models/MasterTrade";
import {
	TradeStatus,
	TradeSide,
	TradingPlatform,
	AccountType,
	OrderPlacementType,
} from "../../config/enums";
import { IOHLCData } from "../../clients/BinanceFuturesClient";

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
				},
			]);

			const trades = await tradeService.getActiveMasterTrades();

			expect(trades).toHaveLength(2);
			expect(trades.some((t) => t.status === TradeStatus.CLOSED)).toBe(false);
		});

		it("should return empty array when no active trades exist", async () => {
			const trades = await tradeService.getActiveMasterTrades();
			expect(trades).toEqual([]);
		});
	});

	describe("createTrade", () => {
		it("should successfully create a new trade", async () => {
			const newTrade = {
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
				pnl: 0,
				pnlPercentage: 0,
				status: TradeStatus.PENDING,
				supportedTradingPlatforms: [TradingPlatform.BINANCE],
				estimatedProfit: 0,
				estimatedLoss: 0,
			};

			const createdTrade = await tradeService.createTrade(newTrade);

			expect(createdTrade).toBeTruthy();
			expect(createdTrade?.baseAsset).toBe("BTC");
			expect(createdTrade?.pair).toBe("BTCUSDT");
			expect(createdTrade?.status).toBe(TradeStatus.PENDING);
		});

		it("should throw error when required fields are missing", async () => {
			const invalidTrade = {
				baseAsset: "BTC",
				// Missing required fields
			} as unknown as ICreateMasterTrade;

			await expect(tradeService.createTrade(invalidTrade)).rejects.toThrow();
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
					estimatedProfit: 0,
					estimatedLoss: 0,
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
				// PNL% = (61200 - 60000) / 60000 * 100 = 2%
				// PNL = 6000 * 2 / 100 = 120
				expect(updatedTrade?.pnlPercentage).toBeCloseTo(2, 2);
				expect(updatedTrade?.pnl).toBeCloseTo(120, 2);
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
					estimatedProfit: 0,
					estimatedLoss: 0,
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
				// PNL% = (58800 - 60000) / 60000 * 100 = -2%
				// PNL = 6000 * -2 / 100 = -120
				expect(updatedTrade?.pnlPercentage).toBeCloseTo(-2, 2);
				expect(updatedTrade?.pnl).toBeCloseTo(-120, 2);
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
					estimatedProfit: 0,
					estimatedLoss: 0,
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
				// PNL% = (60000 - 58800) / 60000 * 100 = 2%
				// PNL = 6000 * 2 / 100 = 120
				expect(updatedTrade?.pnlPercentage).toBeCloseTo(2, 2);
				expect(updatedTrade?.pnl).toBeCloseTo(120, 2);
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
					estimatedProfit: 0,
					estimatedLoss: 0,
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
				// PNL% = (60000 - 61200) / 60000 * 100 = -2%
				// PNL = 6000 * -2 / 100 = -120
				expect(updatedTrade?.pnlPercentage).toBeCloseTo(-2, 2);
				expect(updatedTrade?.pnl).toBeCloseTo(-120, 2);
			});
		});

		describe("PENDING trades - Trigger activation", () => {
			beforeEach(() => {
				process.env.PROCESS_INCOMING_MASTER_TRADES_QUEUE = "test-queue-url";
			});

			it("should activate LONG trade when low price reaches trigger", async () => {
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
				expect(updatedTrade?.status).toBe(TradeStatus.ACTIVE);
				expect(updatedTrade?.pnl).toBe(0);
				expect(updatedTrade?.pnlPercentage).toBe(0);
				expect(updatedTrade?.currentPrice).toBe(59800);

				// Verify queue message was sent
				expect(mockPublishMessageToQueue).toHaveBeenCalledWith({
					queueUrl: "test-queue-url",
					message: expect.stringContaining(trade.id as string),
				});
			});

			it("should activate SHORT trade when high price reaches trigger", async () => {
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
				expect(updatedTrade?.status).toBe(TradeStatus.ACTIVE);
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
					estimatedProfit: 0,
					estimatedLoss: 0,
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
					estimatedProfit: 0,
					estimatedLoss: 0,
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
				expect(updatedBtcTrade?.pnlPercentage).toBeCloseTo(1, 2);

				expect(updatedEthTrade?.currentPrice).toBe(2970);
				expect(updatedEthTrade?.pnlPercentage).toBeCloseTo(1, 2);
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
});
