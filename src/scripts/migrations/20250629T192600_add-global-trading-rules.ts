import { TradingRule } from "../../models/TradingRules";
import { defaultTradingRules } from "../../config/constants";

export async function up() {
	console.log("Running migration: 20250629T192600_add-global-trading-rules.ts");

	try {
		// Check if rules already exist to avoid duplicates
		const existingRulesCount = await TradingRule.countDocuments();

		if (existingRulesCount > 0) {
			console.log(
				`Found ${existingRulesCount} existing trading rules. Skipping insertion to avoid duplicates.`
			);
			return;
		}

		// Insert default trading rules
		const insertedRules = await TradingRule.insertMany(defaultTradingRules);
		console.log(`Successfully inserted ${insertedRules.length} default trading rules:`);

		insertedRules.forEach((rule, index) => {
			console.log(`  ${index + 1}. ${rule.name} (${rule.category})`);
		});
	} catch (error) {
		console.error("Error adding default trading rules:", error);
		throw error;
	}
}

export async function down() {
	console.log("Rolling back migration: 20250629T192600_add-global-trading-rules.ts");

	try {
		// Get the names of rules we're about to delete for logging
		const rulesToDelete = await TradingRule.find({
			name: { $in: defaultTradingRules.map((rule) => rule.name) },
		}).select("name category");

		if (rulesToDelete.length === 0) {
			console.log("No default trading rules found to delete.");
			return;
		}

		// Delete the default trading rules
		const deleteResult = await TradingRule.deleteMany({
			name: { $in: defaultTradingRules.map((rule) => rule.name) },
		});

		console.log(`Successfully deleted ${deleteResult.deletedCount} default trading rules:`);
		rulesToDelete.forEach((rule, index) => {
			console.log(`  ${index + 1}. ${rule.name} (${rule.category})`);
		});
	} catch (error) {
		console.error("Error rolling back default trading rules:", error);
		throw error;
	}
}
