/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { TradingPlatform } from "../../../config/enums";
import { IPlatformTradingRuleResult } from "../../../config/interfaces";

interface SymbolRule {
	minQty: number; // Minimum quantity of the base asset
	minNotional: number; // Minimum notional value in USDT
}

interface TradeInput {
	symbol: string; // e.g., "BTCUSDT"
	price: number; // Current market price
	balance: number; // Margin balance (USDT)
	leverage: number; // Applied leverage
	rules: Record<string, SymbolRule>; // Symbol rules lookup
}

interface TradeValidationResult {
	isValid: boolean;
	reasons: string[];
	positionSize: number;
	quantity: number;
	minQty: number;
	minNotional: number;
}

export function validateTradeEligibility(input: TradeInput): TradeValidationResult {
	const { symbol, price, balance, leverage, rules } = input;

	if (!rules[symbol]) {
		return {
			isValid: false,
			reasons: [`No trading rule found for ${symbol}.`],
			positionSize: 0,
			quantity: 0,
			minQty: 0,
			minNotional: 0,
		};
	}

	const { minQty, minNotional } = rules[symbol];

	// Position size = balance * leverage
	const positionSize = balance * leverage;

	// Quantity = position size / entry price
	const quantity = positionSize / price;

	const reasons: string[] = [];

	if (quantity < minQty) {
		reasons.push(`Quantity ${quantity.toFixed(6)} < minQty ${minQty}`);
	}

	if (positionSize < minNotional) {
		reasons.push(`Position size ${positionSize.toFixed(2)} < minNotional ${minNotional}`);
	}

	return {
		isValid: reasons.length === 0,
		reasons,
		positionSize: parseFloat(positionSize.toFixed(6)),
		quantity: parseFloat(quantity.toFixed(6)),
		minQty,
		minNotional,
	};
}

export async function fetchBinanceFuturesSymbolRules(): Promise<IPlatformTradingRuleResult[]> {
	const res = await fetch("https://fapi.binance.com/fapi/v1/exchangeInfo");
	const data = await res.json();

	const usdtSymbols = data.symbols?.filter(
		(s: any) => s.contractType === "PERPETUAL" && s.quoteAsset === "USDT"
	);

	const rules = usdtSymbols.map((s: any) => {
		const lotFilter =
			s.filters.find((f: any) => f.filterType === "LOT_SIZE") ||
			s.filters.find((f: any) => f.filterType === "MARKET_LOT_SIZE");
		const minNotionalFilter = s.filters.find((f: any) => f.filterType === "MIN_NOTIONAL");

		const result: IPlatformTradingRuleResult = {
			pair: s.symbol,
			baseAsset: s.baseAsset,
			quoteCurrency: s.quoteAsset,
			minQuantity: lotFilter ? parseFloat(lotFilter.minQty) : 0,
			stepSize: lotFilter ? parseFloat(lotFilter.stepSize) : undefined,
			minNotional: minNotionalFilter ? parseFloat(minNotionalFilter.notional) : 0,
			platform: TradingPlatform.BINANCE,
		};
		return result;
	});

	console.table(rules);
	return rules;
}
