import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { checkUser } from "../utils/tokens";

export async function validateOrderRequest(req: Request, res: Response, next: NextFunction) {
	try {
		//check accessToken
		const payload = await checkUser(req);

		//validate request body

		//attach jwt payload to request body and continue
		req.body.payload = payload;
		next();
	} catch (err: any) {
		next(err);
	}
}

// A function to validate user balance from wallet service
export async function validateUserBalance(req: Request, res: Response, next: NextFunction) {
	const { payload } = req.body;
	try {
		// console.log("payload okay: ", payload);
		next();
	} catch (err: any) {
		next(err);
	}
}

// A function to validate user trading rules from portfolio service
export async function validateUserTradingRules(req: Request, res: Response, next: NextFunction) {
	const { payload } = req.body;
	try {
		// console.log("payload okay: ", payload);
		next();
	} catch (err: any) {
		next(err);
	}
}
