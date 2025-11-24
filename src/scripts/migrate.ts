/* eslint-disable @typescript-eslint/no-var-requires */
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import "dotenv/config";
import { ENVIRONMENTS } from "../config/constants";
import { getSecrets, ITradingEngineServiceSecrets, SecretLocation } from "../config/secrets";
import Migration from "./Migration"; // Import the Migration model

const env = process.env.NODE_ENV;
if (!env) {
	console.error("Error: Environment variable not set");
	process.exit(1);
}
const suffix = ENVIRONMENTS[env];

const MIGRATIONS_DIR = path.join(__dirname, "migrations"); // Directory for migration scripts

async function ensureMigrationsCollection() {
	// Mongoose automatically creates the collection if it doesn't exist
	console.log("Ensuring migrations collection exists...");
}

async function runMigration(script: string, action: "up" | "down") {
	const migration = require(path.join(MIGRATIONS_DIR, script));

	if (action === "up" && typeof migration.up === "function") {
		await migration.up();
	} else if (action === "down" && typeof migration.down === "function") {
		await migration.down();
	} else {
		console.error(`Migration ${script} does not have a valid ${action} function.`);
	}
}

async function markAsExecuted(script: string) {
	try {
		await Migration.create({ script, executedAt: new Date() });
	} catch (error: any) {
		console.log("There was an error marking migrations as executed: ", error.message);
		process.exit(1);
	}
}

async function markAsRolledBack(script: string) {
	try {
		await Migration.deleteOne({ script });
	} catch (error: any) {
		console.log("There was an error marking migrations as rolled back: ", error.message);
		process.exit(1);
	}
}

async function getExecutedMigrations() {
	try {
		const migrations = await Migration.find();
		// Sort migrations by executedAt date in descending order
		return migrations
			.sort((a, b) => b.executedAt.getTime() - a.executedAt.getTime())
			.map((m) => m.script);
	} catch (error: any) {
		console.log("There was an error getting executed migrations: ", error.message);
		process.exit(1);
	}
}

async function main() {
	const tradingEngineServiceSecrets = await getSecrets<ITradingEngineServiceSecrets>(
		`${SecretLocation.tradingEngineServiceSecrets}/${suffix}`
	);

	// Connect to MongoDB using Mongoose
	try {
		console.log("Connecting to MongoDB...");
		await mongoose.connect(tradingEngineServiceSecrets.TRADING_ENGINE_SERVICE_DB_URL);
		// await mongoose.connect(process.env.TRADING_ENGINE_SERVICE_DB_URL ?? "");
		console.log("Connected to MongoDB successfully.");
	} catch (error: any) {
		console.error("Error connecting to MongoDB: ", error.message);
		process.exit(1);
	}

	// Ensure the migrations collection exists
	await ensureMigrationsCollection();

	const executedMigrations = await getExecutedMigrations();
	const migrationFiles = fs
		.readdirSync(MIGRATIONS_DIR)
		.filter((file) => file.endsWith(".ts"))
		.sort();

	const action = process.argv[2]; // Get action from command line argument
	const specificMigrationName = process.argv[3]; // Get specific migration name from command line argument

	let specificMigration: string | undefined;

	if (specificMigrationName) {
		// Find the migration file that matches the provided name
		specificMigration = migrationFiles.find(
			(file) => file.includes(specificMigrationName) && file.endsWith(".ts")
		);
		if (!specificMigration) {
			console.error(`Migration file for "${specificMigrationName}" not found.`);
			process.exit(1);
		}
	}

	if (action === "rollback") {
		try {
			if (specificMigration) {
				// Rollback specific migration
				await runMigration(specificMigration, "down");
				await markAsRolledBack(specificMigration);
			} else {
				// Rollback the last executed migration
				const executedMigrations = await getExecutedMigrations();
				if (executedMigrations.length > 0) {
					const lastMigration = executedMigrations[0]; // Get the most recent migration
					await runMigration(lastMigration, "down");
					await markAsRolledBack(lastMigration);
				} else {
					console.log("No migrations have been executed to roll back.");
				}
			}
		} catch (error: any) {
			console.log("There was a problem rolling back migrations: ", error.message);
			process.exit(1);
		}
	} else if (action === "rollback-all") {
		// Rollback all migrations
		const executedMigrations = await getExecutedMigrations();
		if (executedMigrations.length > 0) {
			for (const migration of executedMigrations) {
				await runMigration(migration, "down");
				await markAsRolledBack(migration);
			}
		} else {
			console.log("No migrations have been executed to roll back.");
		}
	} else {
		try {
			if (specificMigration) {
				// Run specific migration
				if (!executedMigrations.includes(specificMigration)) {
					await runMigration(specificMigration, "up");
					await markAsExecuted(specificMigration);
				} else {
					console.log(`Migration ${specificMigration} has already been executed.`);
				}
			} else {
				// Run all migrations
				for (const file of migrationFiles) {
					if (!executedMigrations.includes(file)) {
						await runMigration(file, "up");
						await markAsExecuted(file);
					} else {
						console.log(`Migration ${file} has already been executed.`);
					}
				}
			}
		} catch (error: any) {
			console.log("There was an error running migrations: ", error.message);
			process.exit(1);
		}
	}

	await mongoose.connection.close();
}

main().catch(console.error);
