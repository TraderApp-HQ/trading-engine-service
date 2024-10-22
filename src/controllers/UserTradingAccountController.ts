import { NextFunction, Request, Response } from "express";
import { apiResponseHandler } from "@traderapp/shared-resources";
import { createAccount, deleteAccount } from "../services/UserTradingAccountService";
import { IUserTradingAccount } from "../models/UserTradingAccount";
import { HttpStatus } from "../utils/httpStatus";
import { ResponseMessage, ResponseType } from "../config/constants";

// Create a new trading account
export const handleCreateAccount = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const accountData = req.body as IUserTradingAccount;
		const newAccount = await createAccount(accountData);
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
