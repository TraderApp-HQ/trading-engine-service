import { IUserTradingAccount } from "../models/UserTradingAccount";
import { IUserTradingAccountBalance } from "../models/UserTradingBalance";
import { AccountConnectionStatus, AccountType, Category, Currency, UserRoles } from "./enums";

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
	plaformLogo: string;
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
