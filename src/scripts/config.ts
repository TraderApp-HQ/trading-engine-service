import mongoose from "mongoose";
import "dotenv/config";

interface ScriptConfig {
	scriptFunction: () => Promise<void>;
}

export const runScript = ({ scriptFunction }: ScriptConfig): void => {
	const dbUrl = process.env.MONGO_URI ?? "";
	console.log("db url: ", dbUrl);

	mongoose
		.connect(dbUrl, { serverSelectionTimeoutMS: 20000 })
		.then(async () => {
			console.log("Connected to db");
			return scriptFunction();
		})
		.then(() => {
			console.log("Operation finished successfully!");
		})
		.catch((err) => {
			console.error(`An error occurred: ${err}`);
		})
		.finally(() => {
			mongoose.disconnect().then(() => {
				console.log("Disconnected from db");
			});
		});
};
