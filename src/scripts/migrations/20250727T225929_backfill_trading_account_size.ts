import UserTradingAccountBalance from "../../models/UserTradingAccountBalance";
import TradingAccountRepository from "../../repos/TradingAccountRepo";

export async function up() {
	console.log("Running migration: 20250727T225929_backfill_trading_account_size.ts");

	const tradingAccountRepo = new TradingAccountRepository();
	const balances = await UserTradingAccountBalance.find({});
	let updated = 0;

	for (const balance of balances) {
		const available = balance.availableBalance || 0;
		const locked = balance.lockedBalance || 0;
		const newSize = tradingAccountRepo.computeAccountSize(available, locked);

		if (balance.accountSize !== newSize) {
			balance.accountSize = newSize;
			await balance.save();
			updated++;
		}
	}

	console.log(`Updated accountSize for ${updated} UserTradingAccountBalance documents.`);
}

export async function down() {
	console.log("Rolling back migration: 20250727T225929_backfill_trading_account_size.ts");

	// Option 1: Set all accountSize fields to null
	await UserTradingAccountBalance.updateMany({}, { $set: { accountSize: null } });

	// Option 2: Set all accountSize fields to 0
	// await UserTradingAccountBalance.updateMany({}, { $set: { accountSize: 0 } });

	console.log("All accountSize fields set to null.");
}
