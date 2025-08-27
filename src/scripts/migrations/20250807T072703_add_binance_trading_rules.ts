import { PlatformTradingRule } from "../../models/PlatformTradingRules";
import { fetchBinanceFuturesSymbolRules } from "../fixtures/fetch-binance-trading-rules/helper";

export async function up() {
	console.log("Running migration: 20250807T072703_add_binance_trading_rules.ts");
	const binanceRules = await fetchBinanceFuturesSymbolRules();

	const bulkOps = binanceRules.map((rule) => ({
		updateOne: {
			filter: { pair: rule.pair, platform: rule.platform },
			update: { $set: rule },
			upsert: true,
		},
	}));

	await PlatformTradingRule.bulkWrite(bulkOps);
}

export async function down() {
	console.log("Rolling back migration: 20250807T072703_add_binance_trading_rules.ts");
	// Your rollback logic here
}
