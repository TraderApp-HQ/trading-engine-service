import axios from "axios";

export const getTradeAssetCurrentPrice = async ({
	asset,
	quote,
}: {
	asset: string;
	quote: string;
}): Promise<number | null> => {
	const CMC_API_KEY = process.env.CMC_API_KEY;

	if (!CMC_API_KEY) {
		console.error("CMC_API_KEY environment variable is not set.");
		return null;
	}

	const url = `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?id=${asset}&convert=${quote}`;
	try {
		const res = await axios({
			method: "get",
			url,
			headers: {
				Accept: "application/json",
				"X-CMC_PRO_API_KEY": CMC_API_KEY,
			},
		});

		const price = res.data.data[asset].quote[quote].price;

		return price;
	} catch (err: any) {
		console.log("Error getting asset price:", err.response?.data || err.message);
		return null;
	}
};
