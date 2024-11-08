import { NextFunction, Request, Response } from "express";
import { apiResponseHandler } from "@traderapp/shared-resources";
import UserTradingAccountService from "../services/UserTradingAccountService";
import { IUserTradingAccount } from "../models/UserTradingAccount";
import { HttpStatus } from "../utils/httpStatus";
import { ResponseMessage, ResponseType } from "../config/constants";
import BinanceAccountService from "../services/BinanceAccountService";
import { encrypt } from "../utils/encryption";
import { Category } from "../config/enums";
import UserTradingBalanceService from "../services/UserTradingBalanceService";
import mongoose from "mongoose";

// Create a new trading account
export const handleAddTradingAccount = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const userTradingAccountService = new UserTradingAccountService();
		const userTradingBalanceService = new UserTradingBalanceService();
		const accountData = req.body as IUserTradingAccount;
		const { apiKey, apiSecret } = req.body;

		const userAccountInfo = new BinanceAccountService({
			apiKey: encrypt(apiKey as string),
			apiSecret: encrypt(apiSecret as string),
		});

		const binanceAccountInfo = await userAccountInfo.getBinanceAccountInfo();

		if (accountData.category === Category.CRYPTO) {
			// Create the account first, without balances
			const newAccount = await userTradingAccountService.connectAccount({
				...accountData,
				...binanceAccountInfo,
				balances: [],
			});

			// Add balances and collect their IDs
			const balanceIds = await Promise.all(
				binanceAccountInfo.selectedBalances.map(async (balance) => {
					const createdBalance = await userTradingBalanceService.addAccountBalance({
						userId: newAccount.userId,
						platformName: accountData.platformName,
						platformId: accountData.platformId,
						currency: balance.asset,
						accountType: balance.accountType,
						availableBalance: balance.free,
						lockedBalance: balance.locked,
					});
					return createdBalance._id;
				})
			);

			// Update the account with the balance IDs
			newAccount.balances = balanceIds as mongoose.Types.ObjectId[];
			await newAccount.save();

			res.status(HttpStatus.OK).json(
				apiResponseHandler({
					type: ResponseType.SUCCESS,
					object: newAccount,
					message: ResponseMessage.CREATE_ACCOUNT,
				})
			);
		} else {
			// Todo: implement forex connection
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
		const accountId = req.params.id;
		await userTradingAccountService.deleteAccount(accountId);
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

export const handleGetUserAccountsWithBalances = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const userTradingAccountService = new UserTradingAccountService();
		const userId = req.params.userId;
		const tradingAccount = await userTradingAccountService.getUsersAccountsWithBalances(userId);
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
