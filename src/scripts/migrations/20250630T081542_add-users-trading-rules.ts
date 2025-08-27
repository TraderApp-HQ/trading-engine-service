import mongoose from "mongoose";
import { ENVIRONMENTS } from "../../config/constants";
import { getSecrets, IUsersServiceSecrets, SecretLocation } from "../../config/secrets";
import { UserTradingRule } from "../../models/UserTradingRules";
import { TradingRule } from "../../models/TradingRules";

const env = process.env.NODE_ENV;
if (!env) {
	console.error("Error: Environment variable not set");
	process.exit(1);
}
const suffix = ENVIRONMENTS[env];

export async function up() {
	console.log("Running migration: 20250630T081542_add-users-trading-rules.ts");

	const usersServiceSecrets = await getSecrets<IUsersServiceSecrets>(
		`${SecretLocation.usersServiceSecrets}/${suffix}`
	);

	const userIds: string[] = [];
	let usersDb: mongoose.Connection | null = null;

	try {
		console.log("Connecting to MongoDB...");
		usersDb = mongoose.createConnection(usersServiceSecrets.USERS_SERVICE_DB_URL);

		// Wait for the connection to be ready
		await new Promise((resolve, reject) => {
			if (usersDb) {
				usersDb.once("open", resolve);
				usersDb.once("error", reject);
			} else {
				reject(new Error("Failed to create database connection"));
			}
		});

		console.log("Connected to MongoDB successfully.");

		// Use the native MongoDB driver through Mongoose connection
		const users = (await usersDb.db
			?.collection("users")
			.find({})
			.toArray()) as unknown as Array<{
			id: string;
		}>;

		console.log(`Found ${users.length} users`);

		if (users && users.length > 0) {
			users.forEach((user) => userIds.push(user.id));
		} else {
			console.log("No users found in the database");
			return;
		}
	} catch (error: any) {
		console.error("Error connecting to MongoDB: ", error.message);
		process.exit(1);
	} finally {
		// Close the connection when done
		if (usersDb) {
			await usersDb.close();
		}
	}

	// Get trading rules from the current database
	const tradingRules = await TradingRule.find({});

	if (tradingRules.length === 0) {
		console.error(
			"No trading rules found. Please run the global trading rules migration first."
		);
		return;
	}

	// Create a new trading rule for each user
	console.log(`Creating ${tradingRules.length} trading rules for ${userIds.length} users`);

	const userTradingRulesToCreate = [];
	for (const userId of userIds) {
		for (const rule of tradingRules) {
			userTradingRulesToCreate.push({
				userId,
				ruleId: rule.id,
				name: rule.name,
				description: rule.description,
				tooltip: rule.tooltip,
				category: rule.category,
				type: rule.type,
				value: rule.value,
				isEnabled: rule.isEnabled,
				isCustomized: false,
			});
		}
	}

	// Batch insert for better performance
	await UserTradingRule.insertMany(userTradingRulesToCreate);
	console.log(`Successfully created ${userTradingRulesToCreate.length} user trading rules`);
}

export async function down() {
	console.log("Rolling back migration: 20250630T081542_add-users-trading-rules.ts");

	try {
		// Delete all user trading rules
		const deleteResult = await UserTradingRule.deleteMany({});
		console.log(`Successfully deleted ${deleteResult.deletedCount} user trading rules`);
	} catch (error: any) {
		console.error("Error rolling back user trading rules:", error);
		throw error;
	}
}
