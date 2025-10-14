// Based on the pairs in an array, fetch Binance futures one minute candle and get the OHLC for the different pair

import Binance from "binance-api-node";
// import type { CandleChartResult } from "binance-api-node";

interface IOHLCData {
	symbol: string;
	open: string;
	high: string;
	low: string;
	close: string;
	openTime: number;
	closeTime: number;
	volume: string;
}

interface IFetchBinanceFuturesCandlesInput {
	pairs: string[];
	apiKey?: string;
	apiSecret?: string;
}

async function fetchBinanceFuturesCandles(
	input: IFetchBinanceFuturesCandlesInput
): Promise<IOHLCData[]> {
	try {
		// Initialize Binance client
		const client = Binance({
			apiKey: input.apiKey || "",
			apiSecret: input.apiSecret || "",
			httpFutures:
				process.env.NODE_ENV !== "production"
					? "https://testnet.binancefuture.com"
					: undefined,
		});

		// Fetch candles for all pairs in parallel
		const candlePromises = input.pairs.map(async (symbol) => {
			try {
				const candles = await client.futuresCandles({
					symbol,
					interval: "1m", // 1 minute candle
					limit: 1, // Get only the latest candle
				});

				// Get the most recent candle
				const latestCandle = candles[candles.length - 1];

				return {
					symbol,
					open: latestCandle.open,
					high: latestCandle.high,
					low: latestCandle.low,
					close: latestCandle.close,
					openTime: latestCandle.openTime,
					closeTime: latestCandle.closeTime,
					volume: latestCandle.volume,
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

// Example usage
(async function () {
	const pairs = ["BTCUSDT", "ETHUSDT", "BNBUSDT"];

	// Use your Binance API credentials here
	// const apiKey = "YOUR_API_KEY"; // Optional for public endpoints
	// const apiSecret = "YOUR_API_SECRET"; // Optional for public endpoints

	try {
		const ohlcData = await fetchBinanceFuturesCandles({ pairs });

		console.log("========== OHLC Data for Pairs ==========");
		ohlcData.forEach((data) => {
			console.log(`\nPair: ${data.symbol}`);
			console.log(`Open: ${data.open}`);
			console.log(`High: ${data.high}`);
			console.log(`Low: ${data.low}`);
			console.log(`Close: ${data.close}`);
			console.log(`Volume: ${data.volume}`);
			console.log(`Time: ${new Date(data.openTime).toISOString()}`);
		});
	} catch (error) {
		console.error("Error:", error);
	}
})();
