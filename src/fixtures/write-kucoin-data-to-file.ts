import axios from "axios";
import * as fs from "fs";
import * as path from "path";

(async () => {
	const res = await axios.get("https://api.kucoin.com/api/v2/symbols");
	const kucoinData = res.data.data.map((symbol: any) => {
		return {
			baseCurrency: symbol.baseCurrency,
			quoteCurrency: symbol.quoteCurrency,
			enableTrading: symbol.enableTrading,
			symbol: symbol.symbol,
		};
	});

	// Create TypeScript file content
	const tsContent = `// Auto-generated Kucoin exchange data
export const kucoinExchangeData = ${JSON.stringify(kucoinData, null, 2)} as const;

export type KucoinSymbol = {
	baseCurrency: string;
	quoteCurrency: string;
	enableTrading: boolean;
	symbol: string;
};

export type KucoinExchangeData = typeof kucoinExchangeData;
`;

	// Write to file in the same directory
	const filePath = path.join(__dirname, "kucoinExchangeData.ts");
	fs.writeFileSync(filePath, tsContent, "utf8");

	console.log(`Kucoin data written to ${filePath}`);
	console.log(`Total symbols: ${kucoinData.length}`);
})();
