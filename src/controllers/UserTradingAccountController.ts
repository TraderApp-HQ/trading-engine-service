import { NextFunction, Request, Response } from "express";
import { apiResponseHandler } from "@traderapp/shared-resources";
import UserTradingAccountService from "../services/UserTradingAccountService";
import UserTradingBalanceService from "../services/UserTradingBalanceService";
import BinanceAccountService from "../services/BinanceAccountService";
import { IUserTradingAccount } from "../models/UserTradingAccount";
import { HttpStatus } from "../utils/httpStatus";
import { ResponseMessage, ResponseType } from "../config/constants";
import { encrypt } from "../utils/encryption";
import { Category } from "../config/enums";
import mongoose from "mongoose";
import { manageBalances } from "../utils/manageBalances";

// Create a new trading account
export const handleAddTradingAccount = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const accountData = req.body as IUserTradingAccount;
		const { apiKey, apiSecret } = req.body;
		console.log("API keys and secrets received", apiKey, apiSecret);
		const userTradingAccountService = new UserTradingAccountService();
		const userTradingBalanceService = new UserTradingBalanceService();
		const encryptedKeys = {
			apiKey: encrypt(apiKey as string),
			apiSecret: encrypt(apiSecret as string),
		};
		const userAccountInfo = new BinanceAccountService(encryptedKeys);

		if (accountData.category === Category.CRYPTO) {
			const binanceData = await userAccountInfo.getBinanceAccountInfo();
			const newAccount = await userTradingAccountService.connectAccount({
				...accountData,
				...binanceData,
				balances: [],
			});

			newAccount.balances = (await manageBalances(
				userTradingBalanceService,
				newAccount.userId,
				accountData,
				binanceData
			)) as mongoose.Types.ObjectId[];
			await newAccount.save();

			res.status(HttpStatus.OK).json(
				apiResponseHandler({
					type: ResponseType.SUCCESS,
					object: newAccount,
					message: ResponseMessage.CREATE_ACCOUNT,
				})
			);
		} else {
			res.status(HttpStatus.OK).json(
				apiResponseHandler({
					type: ResponseType.SUCCESS,
					message: ResponseMessage.CREATE_ACCOUNT,
				})
			);
		}
	} catch (error) {
		next(error);
	}
};

// Delete a trading account by ID
export const handleDeleteAccount = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const userTradingAccountService = new UserTradingAccountService();
		await userTradingAccountService.deleteAccount(req.params.id);
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
export const handleGetUserAccountsWithBalances = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		console.log("inside handle ger user account with balances controller");
		const userTradingAccountService = new UserTradingAccountService();
		const tradingAccount = await userTradingAccountService.getUsersAccountsWithBalances(
			req.params.userId
		);
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
export const handleGetUserAccountbyId = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const userTradingAccountService = new UserTradingAccountService();
		const tradingAccount = await userTradingAccountService.getAccountById(
			req.params.tradingAccountId
		);
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

// Update a trading account
export const handleUpdateTradingAccount = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const accountData = req.body as IUserTradingAccount;
		const { apiKey, apiSecret } = req.body;
		const userTradingAccountService = new UserTradingAccountService();
		const userTradingBalanceService = new UserTradingBalanceService();
		const encryptedKeys = {
			apiKey: encrypt(apiKey as string),
			apiSecret: encrypt(apiSecret as string),
		};
		const userAccountInfo = new BinanceAccountService(encryptedKeys);

		if (accountData.category === Category.CRYPTO) {
			const binanceData = await userAccountInfo.getBinanceAccountInfo();
			const updatedAccount = await userTradingAccountService.updateAccount({
				id: req.params.tradingAccountId,
				accountData: { ...accountData, ...binanceData, balances: [] },
			});

			updatedAccount.balances = (await manageBalances(
				userTradingBalanceService,
				updatedAccount.userId,
				accountData,
				binanceData
			)) as mongoose.Types.ObjectId[];
			await updatedAccount.save();

			res.status(HttpStatus.OK).json(
				apiResponseHandler({
					type: ResponseType.SUCCESS,
					object: updatedAccount,
					message: ResponseMessage.UPDATE_ACCOUNT,
				})
			);
		} else {
			res.status(HttpStatus.OK).json(
				apiResponseHandler({
					type: ResponseType.SUCCESS,
					message: ResponseMessage.UPDATE_ACCOUNT,
				})
			);
		}
	} catch (error) {
		next(error);
	}
};
