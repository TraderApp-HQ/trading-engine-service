import { initCoins } from "../../fixtures/asset";
import { getTradingPlatforms } from "../../fixtures/tradingPlatforms";
import Asset from "../../models/Asset";
import Currency from "../../models/Currency";
import TradingPlatform from "../../models/TradingPlatform";
import TradingPlatformPair from "../../models/TradingPlatformPair";
import UnknownCoin from "../../models/UnkownCoin";

export async function up() {
	console.log(
		"Running migration: 20251102T031805_initialize_trading_platforms_assets_and_currencies.ts"
	);

	// Clear Asset, Currency, UnknownCoin & TradingPlatformPair collections
	await Promise.all([
		Asset.deleteMany(),
		Currency.deleteMany(),
		UnknownCoin.deleteMany(),
		TradingPlatform.deleteMany(),
		TradingPlatformPair.deleteMany(),
	]);

	// Run getTradingPlatforms to get platforms data
	// Run initCoins function again to get all trading assets
	await getTradingPlatforms();
	await initCoins();

	console.log(
		"Migration completed successfully for: 20251102T031805_initialize_trading_platforms_assets_and_currencies.ts"
	);
}

export async function down() {
	console.log(
		"Rolling back migration: 20251102T031805_initialize_trading_platforms_assets_and_currencies.ts"
	);

	console.log(
		"Rollback completed successfully for: 20251102T031805_initialize_trading_platforms_assets_and_currencies.ts"
	);
}
