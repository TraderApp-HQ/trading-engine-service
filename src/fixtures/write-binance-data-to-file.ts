import axios from "axios";
import * as fs from "fs";
import * as path from "path";

(async () => {
	const res = await axios.get("https://api.binance.com/api/v3/exchangeInfo");
	const binanceData = res.data.symbols.map((symbol: any) => {
		return {
			baseAsset: symbol.baseAsset,
			quoteAsset: symbol.quoteAsset,
			status: symbol.status,
		};
	});

	// Create TypeScript file content
	const tsContent = `// Auto-generated Binance exchange data
export const binanceExchangeData = ${JSON.stringify(binanceData, null, 2)} as const;

export type BinanceSymbol = {
	baseAsset: string;
	quoteAsset: string;
	status: string;
};

export type BinanceExchangeData = typeof binanceExchangeData;
`;

	// Write to file in the same directory
	const filePath = path.join(__dirname, "binanceExchangeData.ts");
	fs.writeFileSync(filePath, tsContent, "utf8");

	console.log(`Binance data written to ${filePath}`);
	console.log(`Total symbols: ${binanceData.length}`);
})();
