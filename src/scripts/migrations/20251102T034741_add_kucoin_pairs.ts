import { getKucoinMarkets } from "../../fixtures/kucoin";
import TradingPlatformPair from "../../models/TradingPlatformPair";

export async function up() {
	console.log("Running migration: 20251102T034741_add_kucoin_pairs.ts");
	await getKucoinMarkets();

	console.log("Migration completed successfully for: 20251102T034741_add_kucoin_pairs.ts");
}

export async function down() {
	console.log("Rolling back migration: 20251102T034741_add_kucoin_pairs.ts");
	const platformId = 311;
	await TradingPlatformPair.deleteMany({ platformId });

	console.log("Rollback completed successfully for: 20251102T034741_add_kucoin_pairs.ts");
}
