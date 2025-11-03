import { Connection } from "mongoose";
import { TradingPlatformSchema } from "../models/TradingPlatform";

export const transferExchangesCollection = async ({
	conn1,
	conn2,
}: {
	conn1: Connection;
	conn2?: Connection;
}) => {
	if (!conn2) {
		throw new Error("Second database connection is required for this operation.");
	}

	const ExchangeModel1 = conn1.model("Exchanges", TradingPlatformSchema, "exchanges");
	const ExchangeModel2 = conn2.model("Exchanges", TradingPlatformSchema, "exchanges");

	const coins = await ExchangeModel1.find().exec();
	console.log(`Fetched ${coins.length} exchanges from db1`);

	if (coins.length > 0) {
		await ExchangeModel2.insertMany(coins);
		console.log(`Inserted ${coins.length} exchanges into db2`);
	}
};
