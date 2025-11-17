/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { TradingPlatform } from "../../../config/enums";
import { bybitFuturesRules, BybitFuturesRule } from "./bybitFuturesRulesData";

export interface IPlatformTradingRuleResult {
	pair: string;
	baseAsset: string;
	quoteCurrency: string;
	minQuantity: number;
	stepSize?: number;
	minNotional: number;
	platform: TradingPlatform;
}

export function getBybitFuturesSymbolRules(): IPlatformTradingRuleResult[] {
	const rules: IPlatformTradingRuleResult[] = bybitFuturesRules.map((s: BybitFuturesRule) => {
		const result: IPlatformTradingRuleResult = {
			pair: s.pair,
			baseAsset: s.baseAsset,
			quoteCurrency: s.quoteCurrency,
			minQuantity: s.minQuantity,
			stepSize: s.stepSize,
			minNotional: s.minNotional,
			platform: TradingPlatform.BYBIT,
		};
		return result;
	});

	console.table(rules);
	return rules;
}
