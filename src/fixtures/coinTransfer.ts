import { Connection } from "mongoose";
import { AssetSchema } from "../models/Asset";

export const transferCoinsCollection = async ({
	conn1,
	conn2,
}: {
	conn1: Connection;
	conn2?: Connection;
}) => {
	if (!conn2) {
		throw new Error("Second database connection is required for this operation.");
	}

	const CoinsModel1 = conn1.model("Coins", AssetSchema, "coins");
	const CoinsModel2 = conn2.model("Coins", AssetSchema, "coins");

	const coins = await CoinsModel1.find().exec();
	console.log(`Fetched ${coins.length} coins from db1`);

	if (coins.length > 0) {
		await CoinsModel2.insertMany(coins);
		console.log(`Inserted ${coins.length} coins into db2`);
	}
};
