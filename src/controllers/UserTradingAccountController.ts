import { NextFunction, Request, Response } from "express";
import { apiResponseHandler } from "@traderapp/shared-resources";
import { createAccount, deleteAccount } from "../services/UserTradingAccountService";
import { IUserTradingAccount } from "../models/UserTradingAccount";
import { HttpStatus } from "../utils/httpStatus";
import { ResponseMessage, ResponseType } from "../config/constants";
import { getAccountInfo } from "../utils/getAccountInfo";
import { encrypt } from "../utils/encryption";

// Create a new trading account
export const handleCreateAccount = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const accountData = req.body as IUserTradingAccount;
		const { apiKey, apiSecret } = req.body;
		const userAccoutInfo = await getAccountInfo({
			apiKey: encrypt(apiKey as string),
			apiSecret: encrypt(apiSecret as string),
		});
		const newAccount = await createAccount({ ...accountData, ...userAccoutInfo });

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
		const deletedAccount = await deleteAccount(accountId);
		if (!deletedAccount) {
			res.status(HttpStatus.NOT_FOUND).json(
				apiResponseHandler({
					type: ResponseType.ERROR,
					object: deletedAccount,
					message: ResponseMessage.ACCOUNT_NOT_FOUND,
				})
			);
		} else {
			res.status(HttpStatus.OK).json(
				apiResponseHandler({
					type: ResponseType.SUCCESS,
					object: deletedAccount,
					message: ResponseMessage.DELETE_ACCOUNT,
				})
			);
		}
	} catch (error) {
		next(error);
	}
};
