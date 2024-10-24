import { NextFunction, Request, Response } from "express";
import { apiResponseHandler } from "@traderapp/shared-resources";
import { addAccount, deleteAccount } from "../services/UserTradingAccountService";
import { IUserTradingAccount } from "../models/UserTradingAccount";
import { HttpStatus } from "../utils/httpStatus";
import { ResponseMessage, ResponseType } from "../config/constants";
import { getTradingAccountInfo } from "../utils/getAccountInfo";
import { encrypt } from "../utils/encryption";

// Create a new trading account
export const handleAddTradingAccount = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const accountData = req.body as IUserTradingAccount;
		const { apiKey, apiSecret } = req.body;
		const userAccoutInfo = await getTradingAccountInfo({
			apiKey: encrypt(apiKey as string),
			apiSecret: encrypt(apiSecret as string),
		});
		const newAccount = await addAccount({ ...accountData, ...userAccoutInfo });

		if (newAccount.errorMessages.length > 0) {
			res.status(HttpStatus.CREATED).json(
				apiResponseHandler({
					type: ResponseType.ERROR,
					object: newAccount.errorMessages,
					message: ResponseMessage.CREATE_ACCOUNT,
				})
			);
		}
		res.status(HttpStatus.OK).json(
			apiResponseHandler({
				type: ResponseType.SUCCESS,
				object: newAccount,
				message: ResponseMessage.CREATE_ACCOUNT,
			})
		);
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
		const accountId = req.params.id;
		await deleteAccount(accountId);
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
