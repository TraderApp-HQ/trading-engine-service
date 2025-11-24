import { TradingRule } from "../../models/TradingRules";
import { UserTradingRule } from "../../models/UserTradingRules";

export async function up() {
	console.log("Running migration: 20251013T082101_update_risk_percent.ts");

	try {
		// Update global trading rule
		const globalRuleUpdate = await TradingRule.updateMany(
			{ name: "Risk Percentage Per Trade", value: 1 },
			{ $set: { value: 5 } }
		);

		console.log(
			`Updated ${globalRuleUpdate.modifiedCount} global trading rule(s) for Risk Percentage Per Trade from 1% to 5%`
		);

		// Update user trading rules
		const userRulesUpdate = await UserTradingRule.updateMany(
			{ name: "Risk Percentage Per Trade", value: 1 },
			{ $set: { value: 5 } }
		);

		console.log(
			`Updated ${userRulesUpdate.modifiedCount} user trading rule(s) for Risk Percentage Per Trade from 1% to 5%`
		);

		console.log("Migration completed successfully");
	} catch (error: any) {
		console.error("Error updating risk percentage:", error.message);
		throw error;
	}
}

export async function down() {
	console.log("Rolling back migration: 20251013T082101_update_risk_percent.ts");

	try {
		// Rollback global trading rule
		const globalRuleRollback = await TradingRule.updateMany(
			{ name: "Risk Percentage Per Trade", value: 5 },
			{ $set: { value: 1 } }
		);

		console.log(
			`Rolled back ${globalRuleRollback.modifiedCount} global trading rule(s) for Risk Percentage Per Trade from 5% to 1%`
		);

		// Rollback user trading rules
		const userRulesRollback = await UserTradingRule.updateMany(
			{ name: "Risk Percentage Per Trade", value: 5 },
			{ $set: { value: 1 } }
		);

		console.log(
			`Rolled back ${userRulesRollback.modifiedCount} user trading rule(s) for Risk Percentage Per Trade from 5% to 1%`
		);

		console.log("Rollback completed successfully");
	} catch (error: any) {
		console.error("Error rolling back risk percentage:", error.message);
		throw error;
	}
}
