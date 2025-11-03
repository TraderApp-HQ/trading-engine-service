/* eslint-disable array-callback-return */
/* eslint-disable @typescript-eslint/consistent-indexed-object-style */
// import { PrismaClient } from "@prisma/client";

import Asset from "../models/Asset";
import Currency from "../models/Currency";
import TradingPlatform from "../models/TradingPlatform";
import TradingPlatformPair from "../models/TradingPlatformPair";
import UnknownCoin from "../models/UnkownCoin";

// const prisma = new PrismaClient();

import { promises as fs } from "fs";

export async function writeToJson(filename: string, data: any): Promise<void> {
	const filePath = `./seeds/${filename}.json`;
	try {
		const jsonData = JSON.stringify(data, null, 2); // Pretty print the JSON
		await fs.writeFile(filePath, jsonData, "utf8");
		console.log(`${filename} data saved to ${filePath}`);
	} catch (err) {
		console.error(`Failed to write to ${filePath}: `, err);
	}
}

export async function getAllCoins() {
	// hash table for easy searching and retrieval
	const coins: { [k: string]: any } = {};

	// get all coins from db
	const allCoins = await Asset.find();

	// put allCoins into hash Table for easy searching
	allCoins.forEach((coin: any) => {
		if (!coins[coin.symbol]) {
			coins[coin.symbol] = coin.id;
		}
	});

	return coins;
}

export async function getAllCurrencies() {
	const currencies: { [k: string]: any } = {};

	// get currencies from db
	// const allCurrencies = await Currency.find().populate("coin");
	const allCurrencies = await Currency.find();

	// put currencies in hash table for easy retrieval
	allCurrencies.forEach((currency: any) => {
		currencies[currency.symbol] = currency._id;
		// currencies[currency.coin?.symbol] = currency.coinId;
	});

	return currencies;
}

export async function insertTradingPlatformPairs(
	symbols: { [k: string]: any },
	platform: { _id: number; slug: string }
) {
	const coins = await getAllCoins();
	const currencies = await getAllCurrencies();
	let pairs: any[] = [];
	let symbolsMissing: any[] = [];

	// filter out symbols not in db
	Object.entries(symbols).forEach((symbol: any) => {
		symbols[symbol[0]] = symbol[1].filter((item: any) => {
			if (coins[item]) {
				return item;
			} else {
				symbolsMissing.push(item); // get symbols missing
			}
		});
	});

	// group coin pairs
	Object.entries(symbols).forEach((symbol: any) => {
		const pair = symbol[1].map((item: any) => {
			return {
				platformId: platform._id,
				assetId: coins[item],
				currencyId: currencies[symbol[0]],
				asset: item,
				currency: symbol[0],
				pair: `${item}${symbol[0]}`,
				platform: platform.slug,
			};
		});

		pairs = [...pairs, ...pair];
	});

	// remove any duplicates from symbolsMissing
	symbolsMissing = [...new Set(symbolsMissing)];

	// prepare for insertion
	symbolsMissing = symbolsMissing.map((symbol: any) => {
		return { symbol, tradingPlatformId: platform._id };
	});

	// // Write pairs and symbolsMissing to JSON files
	// if (pairs.length) {
	// 	await writeToJson("exchangePairs", pairs);
	// }

	// if (symbolsMissing.length) {
	// 	await writeToJson("unknownCoins", symbolsMissing);
	// }

	// insert pairs
	if (pairs.length) {
		await TradingPlatformPair.insertMany(pairs, { ordered: false });
		console.log("Trading platform pairs inserted", { pairs });
	}

	if (symbolsMissing.length) {
		await UnknownCoin.insertMany(symbolsMissing, { ordered: false });
		console.log("unknown coins inserted", { symbolsMissing });
	}
}

export async function getTradingPlatformData(
	platformSlug: string
): Promise<{ _id: number; slug: string }> {
	const platform = await TradingPlatform.findOne({ slug: platformSlug })
		.select("_id slug")
		.lean();

	if (!platform) {
		throw new Error(`Trading platform with slug "${platformSlug}" not found`);
	}

	return platform as { _id: number; slug: string };
}
