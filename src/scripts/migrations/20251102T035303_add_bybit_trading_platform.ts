/* eslint-disable @typescript-eslint/no-unsafe-argument */
import axios from "axios";
import "dotenv/config";
import { Category, ConnectionType, TradingPlatformStatus } from "../../config/enums";
import TradingPlatform from "../../models/TradingPlatform";

export async function up() {
	console.log("Running migration: 20251102T035303_add_bybit_trading_platform.ts");

	// Check if Bybit already exists
	const existingBybit = await TradingPlatform.findOne({ slug: "bybit" });

	if (existingBybit) {
		console.log("Bybit trading platform already exists, skipping...");
		return;
	}

	const CMC_API_KEY = process.env.CMC_API_KEY ?? "";
	const url = `https://pro-api.coinmarketcap.com/v1/exchange/info?slug=bybit`;

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
		const bybitData = Object.values(result.data)[0] as any;

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
		} = bybitData;

		await TradingPlatform.create({
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
			connectionTypes: [ConnectionType.MANUAL],
			isIpAddressWhitelistRequired: true,
			isSpotTradingSupported: true,
			isFuturesTradingSupported: true,
			isMarginTradingSupported: true,
		});

		console.log("Bybit trading platform added successfully");
	} catch (err: any) {
		console.error("Error adding Bybit:", err.message);
		throw err;
	}

	console.log(
		"Migration completed successfully for: 20251102T035303_add_bybit_trading_platform.ts"
	);
}

export async function down() {
	console.log("Rolling back migration: 20251102T035303_add_bybit_trading_platform.ts");

	// Remove Bybit trading platform
	await TradingPlatform.deleteOne({ slug: "bybit" });
	console.log("Bybit trading platform removed");

	console.log(
		"Rollback completed successfully for: 20251102T035303_add_bybit_trading_platform.ts"
	);
}
