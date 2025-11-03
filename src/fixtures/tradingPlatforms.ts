/* eslint-disable @typescript-eslint/no-unsafe-argument */
import axios from "axios";
import { config } from "dotenv";
import { Category, ConnectionType, TradingPlatformStatus } from "../config/enums";
import TradingPlatform from "../models/TradingPlatform";
// import { PrismaClient } from "@prisma/client";

// load env variables
config();

// const prisma = new PrismaClient();

const CMC_API_KEY = process.env.CMC_API_KEY ?? "";
const exchanges = ["binance", "kucoin"];
const url = `https://pro-api.coinmarketcap.com/v1/exchange/info?slug=${exchanges.join(",")}`;
const data: any[] = [];

// Configuration for exchanges with specific settings
const exchangeConfig: Record<
	string,
	{
		connectionTypes: ConnectionType[];
		isIpAddressWhitelistRequired: boolean;
		isSpotTradingSupported: boolean;
		isFuturesTradingSupported: boolean;
		isMarginTradingSupported: boolean;
	}
> = {
	binance: {
		connectionTypes: [ConnectionType.MANUAL, ConnectionType.FAST],
		isIpAddressWhitelistRequired: true,
		isSpotTradingSupported: true,
		isFuturesTradingSupported: true,
		isMarginTradingSupported: true,
	},
	kucoin: {
		connectionTypes: [ConnectionType.MANUAL],
		isIpAddressWhitelistRequired: false,
		isSpotTradingSupported: true,
		isFuturesTradingSupported: true,
		isMarginTradingSupported: true,
	},
	// Add other exchanges as needed
};

export async function getTradingPlatforms() {
	try {
		const res = await axios({
			method: "get",
			url,
			headers: {
				Accept: "application/json",
				"X-CMC_PRO_API_KEY": CMC_API_KEY,
				"Accept-Encoding": "deflate, gzip",
			},
		});

		const result = res.data;

		Object.values(result.data).forEach((exchange: any) => {
			const {
				id,
				name,
				slug,
				description,
				logo,
				maker_fee: makerFee,
				taker_fee: takerFee,
				urls,
				date_launched: dateLaunched,
			} = exchange;

			// Get specific configuration or apply defaults if not configured
			const config = exchangeConfig[slug.toLowerCase()] || {
				connectionTypes: [ConnectionType.MANUAL],
				isIpAddressWhitelistRequired: false,
				isSpotTradingSupported: true,
				isFuturesTradingSupported: false,
				isMarginTradingSupported: false,
			};

			data.push({
				_id: id,
				name,
				slug,
				description,
				logo,
				makerFee,
				takerFee,
				urls: JSON.stringify(urls),
				dateLaunched,
				status: TradingPlatformStatus.ACTIVE,
				category: [Category.CRYPTO],
				...config,
			});
		});

		// Insert records into db
		const ex = await TradingPlatform.insertMany(data, { ordered: false });
		console.log("Records inserted:", ex);
	} catch (err: any) {
		console.log("Error getting trading platforms:", err.message);
		throw err;
	}
}
