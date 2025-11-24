import { PlatformTradingRule } from "../../models/PlatformTradingRules";
import { getBybitFuturesSymbolRules } from "../fixtures/fetch-bybit-trading-rules/helper";

export async function up() {
	console.log("Running migration: 20251105T141149_add_bybit_trading_rules.ts");

	const bybitRules = getBybitFuturesSymbolRules();

	const bulkOps = bybitRules.map((rule) => ({
		updateOne: {
			filter: { pair: rule.pair, platform: rule.platform },
			update: { $set: rule },
			upsert: true,
		},
	}));

	await PlatformTradingRule.bulkWrite(bulkOps);
	console.log(`✅ Added ${bybitRules.length} Bybit futures trading rules`);
}

export async function down() {
	console.log("Rolling back migration: 20251105T141149_add_bybit_trading_rules.ts");

	const { TradingPlatform } = await import("../../config/enums");
	await PlatformTradingRule.deleteMany({ platform: TradingPlatform.BYBIT });
	console.log("✅ Removed all Bybit trading rules");
}
