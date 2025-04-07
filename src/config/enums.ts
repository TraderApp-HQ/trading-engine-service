export enum AccountConnectionStatus {
	FAILED = "FAILED",
	CONNECTED = "CONNECTED",
	ARCHIVED = "ARCHIVED",
}

export enum AccountType {
	SPOT = "SPOT",
	FUTURES = "FUTURES",
	MARGIN = "MARGIN",
}

export enum Currency {
	USDT = "USDT",
	BTC = "BTC",
}

export enum TradingPlatform {
	BINANCE = "BINANCE",
	KUCOIN = "KUCOIN",
}

export enum Category {
	FOREX = "FOREX",
	CRYPTO = "CRYPTO",
}

export enum ConnectionType {
	MANUAL = "MANUAL",
	FAST = "FAST",
}

export enum UserRoles {
	USER = "USER",
	SUBSCRIBER = "SUBSCRIBER",
	ADMIN = "ADMIN",
	SUPER_ADMIN = "SUPER_ADMIN",
}

export enum OrderType {
	BUY = "BUY",
	SELL = "SELL",
}

export enum OrderPlacementType {
	MARKET = "MARKET",
	LIMIT = "LIMIT",
}

export enum OrderStatus {
	PENDING = "PENDING",
	FILLED = "FILLED",
	PARTIALLY_FILLED = "PARTIALLY_FILLED",
	CANCELED = "CANCELED",
}

// Status of trades
export enum TradeStatus {
	ACTIVE = "ACTIVE",
	CLOSED = "CLOSED",
	PENDING = "PENDING",
}

export enum OrderBatchStatus {
	PENDING = "PENDING",
	FILLED = "FILLED",
	PARTIALLY_FILLED = "PARTIALLY_FILLED",
	CANCELED = "CANCELED",
}

// Trade sides
export enum TradeSide {
	LONG = "LONG",
	SHORT = "SHORT",
}
