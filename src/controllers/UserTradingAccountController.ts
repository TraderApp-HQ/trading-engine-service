import { NextFunction, Request, Response } from "express";
import { apiResponseHandler } from "@traderapp/shared-resources";
import UserTradingAccountService from "../services/UserTradingAccountService";
import { IUserTradingAccount } from "../models/UserTradingAccount";
import { HttpStatus } from "../utils/httpStatus";
import { ResponseMessage, ResponseType } from "../config/constants";
import BinanceAccountService, { IAccountBalance } from "../services/BinanceAccountService";
import { encrypt } from "../utils/encryption";
import { Category } from "../config/enums";
import UserTradingBalanceService from "../services/UserTradingBalanceService";

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

		const userAccoutInfo = new BinanceAccountService({
			apiKey: encrypt(apiKey as string),
			apiSecret: encrypt(apiSecret as string),
		});

		const binanceAccountInfo = await userAccoutInfo.getBinanceAccountInfo();

		if (accountData.category === Category.CRYPTO) {
			const newAccount = await userTradingAccountService.connectAccount({
				...accountData,
				...binanceAccountInfo,
			});

			await Promise.all(
				binanceAccountInfo.selectedBalances.map(async (balance: IAccountBalance) => {
					await userTradingBalanceService.addAccountBalance({
						userId: newAccount.userId,
						platformName: accountData.platformName,
						platformId: accountData.platformId,
						currency: balance.asset,
						accountType: balance.accountType,
						availableBalance: balance.free,
						lockedBalance: balance.locked,
					});
				})
			);

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
