import { Request, Response, NextFunction } from "express";
import { checkUser } from "../utils/tokens";
import Joi from "joi";
import { Category, ConnectionType } from "../config/enums";

export async function validateAddTradingAccountRequest(
	req: Request,
	res: Response,
	next: NextFunction
) {
	try {
		await checkUser(req);

		// define validation schema
		const schema = Joi.object({
			userId: Joi.string().required().label("User Id"),
			platformName: Joi.string().required().label("Platform Name"),
			platformId: Joi.number().required().label("Platform Id"),
			apiKey: Joi.string().required().label("API Key"),
			apiSecret: Joi.string().required().label("API Secret"),
			category: Joi.string()
				.valid(...Object.values(Category))
				.required(),
			connectionType: Joi.string()
				.valid(...Object.values(ConnectionType))
				.required(),
		});

		// validate request
		const { error } = schema.validate(req.body);

		if (error) {
			// strip string of quotes
			error.message = error.message.replace(/\"/g, "");
			next(error);
			throw error;
		}
		next();
	} catch (err: any) {
		next(err);
	}
}

export async function validateDeleteTradingAccountRequest(
	req: Request,
	res: Response,
	next: NextFunction
) {
	try {
		await checkUser(req);

		// define validation schema
		const schema = Joi.object({
			id: Joi.string().required().label("Id"),
		});

		// validate request
		const { error } = schema.validate(req.params);

		if (error) {
			// strip string of quotes
			error.message = error.message.replace(/\"/g, "");
			next(error);
		}
		next();
	} catch (err: any) {
		next(err);
	}
}
