import { Category, ConnectionType, TradingPlatform } from "../../config/enums";
import { APIClient } from "../../repos/ApiClient";
import TradingAccountRepository from "../../repos/TradingAccountRepo";
import { ITradingAccount } from "../interfaces";

export interface ITradingAccountInput {
	userId: string;
	apiKey?: string;
	apiSecret?: string;
	accessToken?: string;
	refreshToken?: string;
	platformName: TradingPlatform;
	category?: Category;
	connectionType?: ConnectionType;
}

export abstract class BaseTradingAccount implements ITradingAccount {
	userId: string;
	apiKey?: string;
	apiSecret?: string;
	accessToken?: string;
	refreshToken?: string;
	platformName: TradingPlatform;
	category?: Category;
	connectionType?: ConnectionType;
	apiClient = APIClient;
	tradingAccountRepo = new TradingAccountRepository();

	constructor(input: ITradingAccountInput) {
		if ((!input.apiKey || !input.apiSecret) && (!input.accessToken || !input.refreshToken)) {
			throw new Error(
				"Invalid credentials: Provide either apiKey & apiSecret or accessToken & refreshToken."
			);
		}

		this.userId = input.userId;
		this.apiKey = input.apiKey;
		this.apiSecret = input.apiSecret;
		this.accessToken = input.accessToken;
		this.refreshToken = input.refreshToken;
		this.platformName = input.platformName;
		this.category = input.category;
		this.connectionType = input.connectionType;
	}

	abstract processTradingAccountInfo(): Promise<void>;
	abstract deleteTradingAccount(): Promise<void>;
}
