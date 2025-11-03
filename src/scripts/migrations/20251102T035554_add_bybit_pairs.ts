import { getBybitMarkets } from "../../fixtures/bybit";
import TradingPlatformPair from "../../models/TradingPlatformPair";

export async function up() {
	console.log("Running migration: 20251102T035554_add_bybit_pairs.ts");
	await getBybitMarkets();

	console.log("Migration completed successfully for: 20251102T035554_add_bybit_pairs.ts");
}

export async function down() {
	console.log("Rolling back migration: 20251102T035554_add_bybit_pairs.ts");
	const platformId = 521;
	await TradingPlatformPair.deleteMany({ platformId });

	console.log("Rollback completed successfully for: 20251102T035554_add_bybit_pairs.ts");
}
