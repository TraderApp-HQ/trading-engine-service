import { apiDocumentationResponseObject } from "@traderapp/shared-resources";
import { TradingRuleCategory, TradingRuleType } from "./enums";

export const ENVIRONMENTS: Record<string, string> = Object.freeze({
	development: "dev",
	staging: "staging",
	production: "prod",
	hotfix: "hotfix",
});

export const ResponseType = {
	SUCCESS: "success",
	ERROR: "error",
};

export const ErrorMessage = {
	unauthorized: "Unauthorized",
	validationError: "ValidationError",
	forbidden: "Forbidden",
	notfound: "NotFound",
};

export const RESPONSE_TAGS = {
	getOrders: "getOrders",
	manualConnection: "manualConnection",
	deleteAccout: "deleteAccout",
	updateAccount: "updateAccount",
};

export const RESPONSE_CODES = {
	ok: "200",
	badRequest: "400",
	unauthorized: "401",
	serverError: "500",
};

export const DOC_RESPONSE = {
	SERVERERROR: apiDocumentationResponseObject("Internal Server Error"),
	UNAUTHORIZED: apiDocumentationResponseObject("Error: Unauthorized"),
	BADREQUEST: apiDocumentationResponseObject("Error: Bad Request"),
	SUCCESS: apiDocumentationResponseObject("Success"),
};

export const ResponseMessage = {
	CREATE_ACCOUNT: "Account created Successfully",
	UPDATE_ACCOUNT: "Account updated Successfully",
	DELETE_ACCOUNT: "Account deleted Successfully",
	ACCOUNT_NOT_FOUND: "Account not found",
	GET_USER_TRADING_ACCOUNT_WITH_BALANCES: "Account Retrieved Successfully",

	GET_TRADE_ASSETS: "Trade assets Fetched Successfully",
	GET_CURRENCIES: "All Currency Fetched Successfully",
	GET_EXCHANGES: "Supported trading platform Fetched Successfully",
	TRADE_PRICE: "Trade Current Price Fetched Successfully",
	TRADE_TP_SL: "Trade TP/SL Updated Successfully",
};

export const ROUTES = {
	getOrders: "/",
	manualConnection: "/connect/manual",
};

export const defaultTradingRules = [
	{
		name: "Risk Percentage Per Trade",
		description: "Maximum percentage of total capital to risk per trade",
		tooltip:
			"This rule limits how much of your total capital can be risked in a single trade. For example, if set to 1%, and you have $10,000, the maximum risk per trade would be $100.",
		category: TradingRuleCategory.RISK_MANAGEMENT,
		type: TradingRuleType.PERCENTAGE,
		value: 1, // 1%
		isEnabled: true,
	},
	{
		name: "Maximum Risk Amount Per Trade",
		description: "Maximum amount to risk per trade in your account currency",
		tooltip:
			"This rule sets a hard limit on the maximum amount you can risk in a single trade, regardless of your account size. The system will use the smaller value between this and the risk percentage.",
		category: TradingRuleCategory.RISK_MANAGEMENT,
		type: TradingRuleType.AMOUNT,
		value: 0, // 0 means no limit
		isEnabled: true,
	},
	{
		name: "Maximum Leverage",
		description: "Maximum allowed leverage for any trade",
		tooltip:
			"This rule limits the maximum leverage you can use for your trades. Higher leverage amplifies both potential profits and losses. For example, if set to 20x, you cannot use leverage higher than 20:1 on any trade.",
		category: TradingRuleCategory.RISK_MANAGEMENT,
		type: TradingRuleType.COUNT,
		value: 20, // 20x leverage
		isEnabled: true,
	},
	{
		name: "Minimum Risk-Reward Ratio",
		description: "Minimum acceptable risk-to-reward ratio for trades",
		tooltip:
			"This rule ensures you only take trades with favorable risk-reward ratios. For example, if set to 2, your potential profit must be at least twice your potential loss. A ratio of 2 means you risk $100 to potentially make $200.",
		category: TradingRuleCategory.RISK_MANAGEMENT,
		type: TradingRuleType.COUNT,
		value: 2, // 1:2 ratio (risk 1 to make 2)
		isEnabled: true,
	},
	{
		name: "Maximum Concurrent Trades",
		description: "Maximum number of trades that can be open simultaneously",
		tooltip:
			"This rule prevents overexposure by limiting the number of trades you can have open at the same time. Once this limit is reached, you must close a position before opening a new one.",
		category: TradingRuleCategory.POSITION_LIMITS,
		type: TradingRuleType.COUNT,
		value: 4,
		isEnabled: true,
	},
	{
		name: "Direction Balance Limit",
		description: "Maximum difference between long and short positions",
		tooltip:
			"This rule helps you maintain a balanced trading portfolio by preventing you from having too many positions in one direction. Think of it like a seesaw - you don't want one side to be much heavier than the other. For example, if set to 2, you can have at most 2 more long positions (betting the price will go up) than short positions (betting the price will go down), or vice versa. This protects you from being overly exposed to market movements in a single direction. If the market suddenly moves against your dominant position type, having this balance helps reduce your overall risk.",
		category: TradingRuleCategory.DIRECTION_BALANCE,
		type: TradingRuleType.COUNT,
		value: 2,
		isEnabled: true,
	},
	{
		name: "Exit Strategy",
		description: "How to handle trade exits",
		tooltip:
			"This rule determines when to close a position. Options include: 'SIGNAL_END' (when the signal ends), 'TARGET_PROFIT' (when target profit is reached), or 'AUTO' (whichever occurs first).",
		category: TradingRuleCategory.EXIT_STRATEGY,
		type: TradingRuleType.STRATEGY,
		value: "AUTO",
		isEnabled: true,
	},
];

export const DEFAULT_ROWS_PER_PAGE = 10;

export const DEFAULT_PAGE = 1;
