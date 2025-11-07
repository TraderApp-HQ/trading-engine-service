import cron from "node-cron";
import { BybitFuturesClient } from "../../clients/BybitFuturesClient";
import { TradeService } from "../../services/TradeService";
import { TradingPlatform } from "../../config/enums";

export const bybitFuturesPairCandlesJob = () => {
	try {
		// Runs every 1 minute
		cron.schedule("* * * * *", async () => {
			const tradeService = new TradeService();
			const bybitFuturesClient = new BybitFuturesClient({
				apiKey: process.env.BYBIT_API_KEY || "",
				apiSecret: process.env.BYBIT_API_SECRET || "",
				environment: process.env.NODE_ENV === "production" ? "mainnet" : "demo",
			});

			const { trades } = await tradeService.getActiveMasterTrades();
			const bybitSupportedTrades = trades.filter(
				(trade) => trade.defaultTradingPlatform === TradingPlatform.BYBIT
			);

			if (bybitSupportedTrades.length === 0) {
				// console.log("No active or pending Bybit trades to process");
				return;
			}

			// Extract unique pairs from trades
			const uniquePairs = [...new Set(bybitSupportedTrades.map((trade) => trade.pair))];

			// Fetch OHLC data for all pairs
			const ohlcData = await bybitFuturesClient.fetchBybitFuturesCandles({
				pairs: uniquePairs,
				interval: "1", // 1 minute interval
			});

			await tradeService.processMasterTradesWithCandles(ohlcData, bybitSupportedTrades);
		});
	} catch (error) {
		console.error("Error running Bybit Futures Pair Candles Job:", error);
	}
};
