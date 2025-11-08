import { IUserTradingAccount } from "../models/UserTradingAccount";
import { IUserTradingAccountBalance } from "../models/UserTradingAccountBalance";
import {
	AccountConnectionStatus,
	AccountType,
	Category,
	Currency,
	OrderPlacementType,
	TradingPlatform,
	TradingRuleCategory,
	TradingRuleType,
	UserRoles,
} from "./enums";

export interface IAccessToken {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	isPhoneVerified: boolean;
	isEmailVerified: boolean;
	isIdVerified: boolean;
	role: UserRoles[];
}

export interface IAccountBalance {
	currency: Currency;
	availableBalance: number;
	lockedBalance: number;
	accountType: AccountType;
}

export interface IUserAccountWithBalance {
	id: string;
	platformName: string;
	platformId: number;
	// plaformLogo: string;
	category: Category;
	errorMessages: string[];
	connectionStatus: AccountConnectionStatus;
	balances: IAccountBalance[];
}

export interface IUpdateAccount {
	id: string;
	accountData: Partial<IUserTradingAccount>;
}

export interface IUpdateBalance {
	id: string;
	tradingBalanceData: Partial<IUserTradingAccountBalance>;
}
export interface ITradingPlatform {
	name: TradingPlatform;
	id: number;
	logo: string;
	category: Category;
}
export interface IAddFund {
	userId: string;
	platformName: TradingPlatform;
	accountType: AccountType;
	currency: Currency;
	amount: number;
}

// Trading Rules Schema
export interface TradingRule {
	id: string;
	name: string;
	description: string;
	tooltip: string;
	category: TradingRuleCategory;
	type: TradingRuleType;
	value: number | string;
	isEnabled: boolean;
	createdAt: Date;
	updatedAt: Date;
}

// User Trading Rules Schema
export interface UserTradingRule {
	id: string;
	userId: string;
	ruleId: string; // Reference to TradingRule
	value: number | string;
	isEnabled: boolean;
	isCustomized: boolean; // Flag to indicate if user has modified from default
	lastResetToDefault: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface IPlatformTradingRuleResult {
	pair: string;
	baseAsset: string;
	quoteCurrency: string;
	minQuantity: number;
	stepSize?: number;
	minNotional: number;
	platform: TradingPlatform;
}

export interface IProcessUserTradingWithMasterTradeEvent {
	masterTradeId: string;
	stopLossPrice: number;
	takeProfitPrice: number;
	entryPrice: number;
	baseAsset: string;
	quoteCurrency: string;
	pair: string;
	supportedTradingPlatforms: TradingPlatform[];
	defaultTradingPlatform: TradingPlatform;
	tradeSide: TradeSide;
	targetOrdersAmountToFill: number;
	orderPlacementType?: OrderPlacementType; // default is MARKET if not provided
	accountType?: AccountType; // default is FUTURES if not provided
	baseAssetLogoUrl?: string;
}

export interface ITradeAggregate {
	accummulatedTotalBalance: number;
	accummulatedTotalRisk: number;
	accummulatedUnrealisedPnL: number;
	accummulatedUnrealisedPnLPercentage: number;
}
