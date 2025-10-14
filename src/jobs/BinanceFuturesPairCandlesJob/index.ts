import cron from "node-cron";
import { BinanceFuturesClient } from "../../clients/BinanceFuturesClient";
import { TradeService } from "../../services/TradeService";

export const binanceFuturesPairCandlesJob = () => {
	try {
		// Runs every 1 minute
		cron.schedule("* * * * *", async () => {
			const tradeService = new TradeService();
			const binanceFuturesClient = new BinanceFuturesClient(
				process.env.BINANCE_FUTURES_API_KEY || "",
				process.env.BINANCE_FUTURES_API_SECRET || ""
			);

			const trades = await tradeService.getActiveMasterTrades();
			if (trades.length === 0) {
				console.log("No active or pending trades to process");
				return;
			}

			// Extract unique pairs from trades
			const uniquePairs = [...new Set(trades.map((trade) => trade.pair))];

			// Fetch OHLC data for all pairs
			const ohlcData = await binanceFuturesClient.fetchBinanceFuturesCandles({
				pairs: uniquePairs,
				interval: "1m",
			});
			await tradeService.processMasterTradesWithCandles(ohlcData, trades);
		});
	} catch (error) {
		console.error("Error running Binance Futures Pair Candles Job:", error);
	}
};
