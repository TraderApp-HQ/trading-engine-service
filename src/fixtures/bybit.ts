/* eslint-disable @typescript-eslint/consistent-indexed-object-style */
// import axios from "axios";
import { config } from "dotenv";
import { getAllCurrencies, getTradingPlatformData, insertTradingPlatformPairs } from "./helpers";
import { bybitExchangeData, BybitSymbol } from "./bybitExchangeData";

// load env variables
config();

export async function getBybitMarkets() {
	// bybit api endpoint for spot trading pairs
	// const url = "https://api.bybit.com/v5/market/instruments-info?category=spot";

	const symbols: { [k: string]: any } = {};

	try {
		// retrieve all currencies & bybit data from db
		const [currencies, platform] = await Promise.all([
			getAllCurrencies(),
			getTradingPlatformData("bybit"),
		]);

		// fetch from bybit api
		// const res = await axios({
		// 	method: "get",
		// 	url,
		// });
		// const result = res.data;

		// loop through and get only active markets in our specified currencies. E.g USDT etc
		Object.keys(currencies).forEach((currency: any) => {
			const assets: any[] = [];
			bybitExchangeData.forEach((symbol: BybitSymbol) => {
				// Check if trading is enabled and matches our currency
				if (symbol.status === "Trading" && symbol.quoteCoin === currency) {
					assets.push(symbol.baseCoin);
				}
			});

			// add assets to symbol object
			symbols[currency] = assets;
		});

		// insert exchange pairs
		await insertTradingPlatformPairs(symbols, platform);
	} catch (err: any) {
		console.log("Error getting bybit markets: ", err.message);
		throw err;
	}
}
