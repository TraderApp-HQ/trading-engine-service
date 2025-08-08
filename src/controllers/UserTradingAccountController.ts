import { NextFunction, Request, Response } from "express";
import { apiResponseHandler } from "@traderapp/shared-resources";
import { IUserTradingAccount } from "../models/UserTradingAccount";
import { HttpStatus } from "../utils/httpStatus";
import { ResponseMessage, ResponseType } from "../config/constants";
import { AccountType, ConnectionType, Currency, TradingPlatform } from "../config/enums";
import TradingAccountFactory from "../factories/TradingAccountFactory";
import TradingAccountRepository from "../repos/TradingAccountRepo";
import { IAddFund } from "../config/interfaces";
import { publishMessageToQueue } from "../utils/helpers/SQSClient/helpers";
import { UserOnboardingChecklist } from "../utils/helpers/types";

export const handleTradingAccountManualConnection = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const { platformName, userId, category, apiKey, apiSecret, passphrase } =
			req.body as IUserTradingAccount;

		const tradingAccountFatory = TradingAccountFactory.initTradingAccount({
			platformName,
			userId,
			category,
			apiKey,
			apiSecret,
			passphrase,
			connectionType: ConnectionType.MANUAL,
		});

		const accountData = await tradingAccountFatory.processTradingAccountInfo();
		const futuresAccountBalance = accountData.balances
			.filter(
				(balance) =>
					balance.accountType === AccountType.FUTURES &&
					balance.currency === Currency.USDT
			)
			.reduce((acc, bal) => acc + (bal.availableBalance ?? 0), 0);

		// Publish user task status to queue
		await Promise.all([
			publishMessageToQueue({
				queueUrl: process.env.TRACK_USER_ONBOARDING_CHECKLIST_QUEUE ?? "",
				message: {
					userId,
					onboardingChecklistItem: UserOnboardingChecklist.IS_TRADING_ACCOUNT_CONNECTED,
				},
			}),
			publishMessageToQueue({
				queueUrl: process.env.TRACK_USER_ONBOARDING_CHECKLIST_QUEUE ?? "",
				message: {
					userId,
					onboardingChecklistItem: UserOnboardingChecklist.IS_PERSONAL_ATC_FUNDED,
					value: futuresAccountBalance >= 50,
				},
			}),
		]);

		console.log("=================== message published to queue ======================", {
			queueUrl: process.env.TRACK_USER_ONBOARDING_CHECKLIST_QUEUE ?? "",
			userId,
			onboardingChecklistItem: UserOnboardingChecklist.IS_TRADING_ACCOUNT_CONNECTED,
		});

		res.status(HttpStatus.OK).json(
			apiResponseHandler({
				type: ResponseType.SUCCESS,
				message: ResponseMessage.CREATE_ACCOUNT,
			})
		);
	} catch (error) {
		next(error);
	}
};

// Delete a trading account by ID
export const handleDeleteUserTradingAccount = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const { userId, platformName } = req.query as {
			userId: string;
			platformName: TradingPlatform;
		};
		const tradingRepo = new TradingAccountRepository();
		await tradingRepo.archiveTradingAccount({ userId, platformName });
		res.status(HttpStatus.OK).json(
			apiResponseHandler({
				type: ResponseType.SUCCESS,
				message: ResponseMessage.DELETE_ACCOUNT,
			})
		);
	} catch (error) {
		next(error);
	}
};

// Get user accounts with balances
export const handleGetUserTradingAccounts = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const { userId } = req.query as {
			userId: string;
		};
		const tradingRepo = new TradingAccountRepository();
		const tradingAccount = await tradingRepo.getUserTradingAccountsWithBalancesFromDb({
			userId,
		});
		res.status(HttpStatus.OK).json(
			apiResponseHandler({
				type: ResponseType.SUCCESS,
				object: tradingAccount,
				message: ResponseMessage.GET_USER_TRADING_ACCOUNT_WITH_BALANCES,
			})
		);
	} catch (error) {
		next(error);
	}
};

// Get a specific user account with balances
export const handleGetUserTradingAccount = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const { userId, platformName } = req.query as {
			userId: string;
			platformName: TradingPlatform;
		};
		const tradingRepo = new TradingAccountRepository();
		const tradingAccount = await tradingRepo.getUserTradingAccountWithBalancesFromDb({
			userId,
			platformName,
		});
		res.status(HttpStatus.OK).json(
			apiResponseHandler({
				type: ResponseType.SUCCESS,
				object: tradingAccount,
				message: ResponseMessage.GET_USER_TRADING_ACCOUNT_WITH_BALANCES,
			})
		);
	} catch (error) {
		next(error);
	}
};

export const handleAddFundToTradingAccount = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const { platformName, userId, accountType, amount, currency } = req.body as IAddFund;

		const tradingRepo = new TradingAccountRepository();
		await tradingRepo.addFundToTradingAccount({
			userId,
			platformName,
			accountType,
			amount,
			currency,
		});

		res.status(HttpStatus.OK).json(
			apiResponseHandler({
				type: ResponseType.SUCCESS,
				message: "Fund added Successfully",
			})
		);
	} catch (error) {
		next(error);
	}
};
