import {
	AccountConnectionStatus,
	AccountType,
	Category,
	ConnectionType,
	Currency,
	TradingPlatform,
} from "../config/enums";

export interface ITradingAccountBalances {
	currency: Currency;
	accountType: AccountType;
	availableBalance: number;
	lockedBalance?: number;
}

export interface ITradingAccountInfo {
	accountId: string;
	userId: string; // Reference to the user who owns these credentials
	platformName: TradingPlatform;
	platformId: number; // e.g., 112
	platformLogo: string;
	apiKey?: string;
	apiSecret?: string;
	passphrase?: string;
	accessToken?: string;
	refreshToken?: string;
	externalAccountUserId: string; // Unique identifier returned by trading plaforms like Binance
	isWithdrawalEnabled: boolean;
	isFuturesTradingEnabled: boolean;
	isSpotTradingEnabled: boolean;
	isIpAddressWhitelisted?: boolean;
	connectionStatus: AccountConnectionStatus;
	errorMessages: string[]; // List of reasons/messages for the unhealthy status
	category: Category;
	connectionType: ConnectionType;
	balances: ITradingAccountBalances[];
}

export interface ITradingAccount {
	processTradingAccountInfo: () => Promise<void>;
	deleteTradingAccount: () => Promise<void>;
}
