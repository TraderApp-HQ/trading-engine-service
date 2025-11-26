/* eslint-disable @typescript-eslint/no-unsafe-argument */
import * as fs from "fs";
import * as path from "path";

(async () => {
	const res = await fetch("https://fapi.binance.com/fapi/v1/exchangeInfo");
	const data = await res.json();

	const usdtSymbols = data.symbols?.filter(
		(s: any) => s.contractType === "PERPETUAL" && s.quoteAsset === "USDT"
	);

	const binanceRules = usdtSymbols.map((s: any) => {
		const lotFilter =
			s.filters.find((f: any) => f.filterType === "LOT_SIZE") ||
			s.filters.find((f: any) => f.filterType === "MARKET_LOT_SIZE");
		const minNotionalFilter = s.filters.find((f: any) => f.filterType === "MIN_NOTIONAL");

		const result = {
			pair: s.symbol,
			baseAsset: s.baseAsset,
			quoteCurrency: s.quoteAsset,
			minQuantity: lotFilter ? parseFloat(lotFilter.minQty) : 0,
			stepSize: lotFilter ? parseFloat(lotFilter.stepSize) : undefined,
			minNotional: minNotionalFilter ? parseFloat(minNotionalFilter.notional) : 0,
		};
		return result;
	});

	// Create TypeScript file content
	const tsContent = `// Auto-generated Binance futures trading rules
export const binanceFuturesRules = ${JSON.stringify(binanceRules, null, 2)} as const;

export type BinanceFuturesRule = {
	pair: string;
	baseAsset: string;
	quoteCurrency: string;
	minQuantity: number;
	stepSize: number;
	minNotional: number;
};

export type BinanceFuturesRules = typeof binanceFuturesRules;
`;

	// Write to file in the same directory
	const filePath = path.join(__dirname, "binanceFuturesRulesData.ts");
	fs.writeFileSync(filePath, tsContent, "utf8");

	console.log(`✅ Binance futures trading rules written to ${filePath}`);
	console.log(`Total rules: ${binanceRules.length}`);
})();
