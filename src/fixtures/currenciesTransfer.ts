import { Connection } from "mongoose";
import { CurrencySchema } from "../models/Currency";

export const transferCurrenciesCollection = async ({
	conn1,
	conn2,
}: {
	conn1: Connection;
	conn2?: Connection;
}) => {
	if (!conn2) {
		throw new Error("Second database connection is required for this operation.");
	}

	const CurrenciesModel1 = conn1.model("Currency", CurrencySchema, "currencies");
	const CurrenciesModel2 = conn2.model("Currency", CurrencySchema, "currencies");

	const currencies = await CurrenciesModel1.find().exec();
	console.log(`Fetched ${currencies.length} currencies from db1`);

	if (currencies.length > 0) {
		const validCurrencies = currencies.filter((currency) => currency.id !== undefined);
		if (validCurrencies.length !== currencies.length) {
			console.warn(
				`Some currencies were missing the 'id' field and will not be transferred.`
			);
		}

		if (validCurrencies.length > 0) {
			await CurrenciesModel2.insertMany(validCurrencies);
			console.log(`Inserted ${validCurrencies.length} currencies into db2`);
		} else {
			console.warn("No valid currencies to insert into db2.");
		}
	}
};
