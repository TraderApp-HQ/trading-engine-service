import {
	AccountType,
	CandleStick,
	Category,
	OrderPlacementType,
	TradeRisk,
	TradeSide,
	TradeStatus,
	TradingPlatform,
} from "../../config/enums";
import { ICreateMasterTrade, MasterTrade } from "../../models/MasterTrade";

const sampleMasterTrades: ICreateMasterTrade[] = [
	{
		signalId: "djfhdjasdkjsa98ssaasdcc",
		baseAsset: "BTC",
		baseAssetLogoUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png",
		quoteCurrency: "USDT",
		baseQuantity: 10000,
		quoteTotal: 0.2,
		currentPrice: 113000,
		entryPrice: 115000,
		stopLossPrice: 112000,
		takeProfitPrice: 124000,
		ordersTriggerPrice: 114500,
		targetOrdersAmountToFill: 5000,
		pair: "BTC/USDT",
		side: TradeSide.LONG,
		status: TradeStatus.PENDING,
		candlestick: CandleStick.fifteenMin,
		category: Category.CRYPTO,
		estimatedLoss: 0,
		estimatedProfit: 0,
		risk: TradeRisk.low,
		accountType: AccountType.FUTURES,
		chartUrl: "",
		tradeNote: "BTC",
		orderPlacementType: OrderPlacementType.LIMIT,
		supportedTradingPlatforms: [TradingPlatform.BINANCE],
	},
	{
		signalId: "djfh454mnk3ert80fcsdcc",
		baseAsset: "ETH",
		baseAssetLogoUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png",
		quoteCurrency: "USDT",
		baseQuantity: 10000,
		quoteTotal: 0.15,
		currentPrice: 4130,
		entryPrice: 4100,
		stopLossPrice: 4250,
		takeProfitPrice: 3850,
		ordersTriggerPrice: 4150,
		targetOrdersAmountToFill: 2000,
		pair: "ETH/USDT",
		side: TradeSide.SHORT,
		status: TradeStatus.PENDING,
		candlestick: CandleStick.fifteenMin,
		category: Category.CRYPTO,
		estimatedLoss: 0,
		estimatedProfit: 0,
		risk: TradeRisk.low,
		accountType: AccountType.FUTURES,
		chartUrl: "",
		tradeNote: "ETH",
		orderPlacementType: OrderPlacementType.LIMIT,
		supportedTradingPlatforms: [TradingPlatform.BINANCE],
	},
	{
		signalId: "djfhdj93n5ivfdcdsdcc",
		baseAsset: "ADA",
		baseAssetLogoUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/2010.png",
		quoteCurrency: "USDT",
		baseQuantity: 10000,
		quoteTotal: 0.12,
		currentPrice: 0.8035,
		entryPrice: 0.78,
		stopLossPrice: 0.76,
		takeProfitPrice: 0.94,
		ordersTriggerPrice: 0.775,
		targetOrdersAmountToFill: 1500,
		pair: "ADA/USDT",
		side: TradeSide.LONG,
		status: TradeStatus.ACTIVE,
		candlestick: CandleStick.fifteenMin,
		category: Category.CRYPTO,
		estimatedLoss: 0,
		estimatedProfit: 0,
		risk: TradeRisk.low,
		accountType: AccountType.FUTURES,
		chartUrl: "",
		tradeNote: "ADA",
		orderPlacementType: OrderPlacementType.LIMIT,
		supportedTradingPlatforms: [TradingPlatform.BINANCE],
	},
	{
		signalId: "djfhaskjdskd9c87c8saasdcc",
		baseAsset: "XRP",
		baseAssetLogoUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/52.png",
		quoteCurrency: "USDT",
		baseQuantity: 10000,
		quoteTotal: 0.16,
		currentPrice: 2.845,
		entryPrice: 2.75,
		stopLossPrice: 2.65,
		takeProfitPrice: 3.15,
		ordersTriggerPrice: 2.7,
		targetOrdersAmountToFill: 5000,
		pair: "XRP/USDT",
		side: TradeSide.LONG,
		status: TradeStatus.ACTIVE,
		candlestick: CandleStick.fifteenMin,
		category: Category.CRYPTO,
		estimatedLoss: 0,
		estimatedProfit: 0,
		risk: TradeRisk.low,
		accountType: AccountType.FUTURES,
		chartUrl: "",
		tradeNote: "XRP",
		orderPlacementType: OrderPlacementType.LIMIT,
		supportedTradingPlatforms: [TradingPlatform.BINANCE],
	},
	{
		signalId: "djfhdjasdkjsa98ssaasdcc",
		baseAsset: "SOL",
		baseAssetLogoUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png",
		quoteCurrency: "USDT",
		baseQuantity: 10000,
		quoteTotal: 0.12,
		currentPrice: 210,
		entryPrice: 205.5,
		stopLossPrice: 216,
		takeProfitPrice: 192,
		ordersTriggerPrice: 207,
		targetOrdersAmountToFill: 500,
		pair: "SOL/USDT",
		side: TradeSide.SHORT,
		status: TradeStatus.ACTIVE,
		candlestick: CandleStick.fifteenMin,
		category: Category.CRYPTO,
		estimatedLoss: 0,
		estimatedProfit: 0,
		risk: TradeRisk.low,
		accountType: AccountType.FUTURES,
		chartUrl: "",
		tradeNote: "SOL",
		orderPlacementType: OrderPlacementType.LIMIT,
		supportedTradingPlatforms: [TradingPlatform.BINANCE],
	},
];

export async function up() {
	console.log("Running migration: 20251001T065106_create-sample-master-trades.ts");
	// Your migration logic here
	try {
		const masterTrades = await MasterTrade.insertMany(sampleMasterTrades);
		console.log(`Inserted ${masterTrades.length} master trades`);
	} catch (error) {
		console.error("Error adding sample master trades:", error);
		throw error;
	}
}

export async function down() {
	console.log("Rolling back migration: 20251001T065106_create-sample-master-trades.ts");
	// Your rollback logic here
	try {
		await MasterTrade.updateMany(
			{ signalId: { $in: sampleMasterTrades.map((trade) => trade.signalId) } },
			{ $set: { status: TradeStatus.CLOSED } }
		);
		console.log("Updated all sample master trades status to closed");
	} catch (error) {
		console.error("Error deleting sample master trades:", error);
		throw error;
	}
}
