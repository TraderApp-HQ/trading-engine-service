// import axios from "axios";
import { config } from "dotenv";
import { getAllCurrencies, getTradingPlatformData, insertTradingPlatformPairs } from "./helpers";
import { binanceExchangeData, BinanceSymbol } from "./binanceExchangeData";

// load env variables
config();

export async function getBinanceMarkets() {
	// binance api endpoint
	// const url = "https://api.binance.com/api/v3/exchangeInfo";

	const symbols: Record<string, any> = {};

	// retrieve all currencies & binance data from db
	const [currencies, platform] = await Promise.all([
		getAllCurrencies(),
		getTradingPlatformData("binance"),
	]);

	console.log("currencies", currencies);
	console.log("platform", platform);

	// fetch from binance api
	// const res = await axios.get(url);
	// const result = res.data;
	// console.log("result from binance api", result);

	// loop through and get only active markets in our speciefied currencies. E.g USDT etc
	Object.keys(currencies).forEach((currency: any) => {
		const assets: any[] = [];
		binanceExchangeData.forEach((symbol: BinanceSymbol) => {
			if (symbol.status === "TRADING" && symbol.quoteAsset === currency) {
				assets.push(symbol.baseAsset);
			}
		});

		// add assets to symbol object
		symbols[currency] = assets;
	});

	// insert exchange pairs
	await insertTradingPlatformPairs(symbols, platform);
}
