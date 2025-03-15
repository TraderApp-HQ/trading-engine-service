import { IUserTradingAccount } from "../models/UserTradingAccount";
import { IUserTradingAccountBalance } from "../models/UserTradingAccountBalance";
import {
	AccountConnectionStatus,
	AccountType,
	Category,
	Currency,
	TradingPlatform,
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
