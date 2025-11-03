import Asset from "../../models/Asset";
import TradingPlatformPair from "../../models/TradingPlatformPair";

export async function up() {
	console.log("Running migration: 20251102T035059_delete_stable_coins_from_assets_collection.ts");
	// Stable coin list
	const stableCoinList = [
		"USDT",
		"USDC",
		"BUSD",
		"USDe",
		"DAI",
		"FRAX",
		"PYUSD",
		"FDUSD",
		"USDP",
		"GUSD",
		"LUSD",
		"OUSD",
		"TUSD",
		"WLFI",
		"USD1",
		"RLUSD",
	];

	// Delete all stable coins and their trading pairs in parallel
	await Promise.all([
		Asset.deleteMany({ symbol: { $in: stableCoinList } }),
		TradingPlatformPair.deleteMany({ asset: { $in: stableCoinList } }),
	]);

	console.log(
		"Migration completed successfully for: 20251102T035059_delete_stable_coins_from_assets_collection.ts"
	);
}

export async function down() {
	console.log(
		"Rolling back migration: 20251102T035059_delete_stable_coins_from_assets_collection.ts"
	);
	// Your rollback logic here

	console.log(
		"Rollback completed successfully for: 20251102T035059_delete_stable_coins_from_assets_collection.ts"
	);
}
