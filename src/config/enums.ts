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
