/* eslint-disable @typescript-eslint/consistent-indexed-object-style */
// import axios from "axios";
import { config } from "dotenv";
import { getAllCurrencies, getTradingPlatformData, insertTradingPlatformPairs } from "./helpers";
import { kucoinExchangeData, KucoinSymbol } from "./kucoinExchangeData";

// load env variables
config();

export async function getKucoinMarkets() {
	// kucoin api endpoint
	// const url = "https://api.kucoin.com/api/v2/symbols";

	const symbols: { [k: string]: any } = {};

	try {
		// retrieve all currencies & kucoin data from db
		const [currencies, platform] = await Promise.all([
			getAllCurrencies(),
			getTradingPlatformData("kucoin"),
		]);

		// fetch from kucoin api
		// const res = await axios({
		// 	method: "get",
		// 	url,
		// });
		// const result = res.data;

		// loop through and get only active markets in our speciefied currencies. E.g USDT etc
		Object.keys(currencies).forEach((currency: any) => {
			const assets: any[] = [];
			kucoinExchangeData.forEach((symbol: KucoinSymbol) => {
				if (symbol.enableTrading && symbol.quoteCurrency === currency) {
					assets.push(symbol.baseCurrency);
				}
			});

			// add assets to symbol object
			symbols[currency] = assets;
		});

		// insert exchange pairs
		await insertTradingPlatformPairs(symbols, platform);
	} catch (err: any) {
		console.log("Error getting kucoin markets: ", err.message);
		throw err;
	}
}
