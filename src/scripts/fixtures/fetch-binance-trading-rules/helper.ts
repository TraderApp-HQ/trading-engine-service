/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { TradingPlatform } from "../../../config/enums";
import { IPlatformTradingRuleResult } from "../../../config/interfaces";
import { binanceFuturesRules } from "./binanceFuturesRulesData";

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
	const rules = binanceFuturesRules.map((s: any) => {
		const result: IPlatformTradingRuleResult = {
			pair: s.symbol,
			baseAsset: s.baseAsset,
			quoteCurrency: s.quoteAsset,
			minQuantity: s.minQuantity,
			stepSize: s.stepSize,
			minNotional: s.minNotional,
			platform: TradingPlatform.BINANCE,
		};
		return result;
	});

	console.table(rules);
	return rules;
}
