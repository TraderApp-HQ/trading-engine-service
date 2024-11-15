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

		// Define regex for API key and secret validation
		const apiKeyRegex = /^[A-Za-z0-9]{64}$/;

		// define validation schema
		const schema = Joi.object({
			userId: Joi.string().required().label("User Id"),
			platformName: Joi.string().required().label("Platform Name"),
			platformId: Joi.number().required().label("Platform Id"),
			platformLogo: Joi.string().required().label("Platform Logo"),
			apiKey: Joi.string().pattern(apiKeyRegex).required().label("API Key").messages({
				"string.pattern.base": "API Key is invalid",
			}),
			apiSecret: Joi.string().pattern(apiKeyRegex).required().label("API Secret").messages({
				"string.pattern.base": "API Secret is invalid",
			}),
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

export async function validateGetUserAccountsWithBalancesRequest(
	req: Request,
	res: Response,
	next: NextFunction
) {
	try {
		await checkUser(req);

		// define validation schema
		const schema = Joi.object({
			userId: Joi.string().required().label("User Id"),
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

export async function validatehandleGetUserAccountbyIdRequest(
	req: Request,
	res: Response,
	next: NextFunction
) {
	try {
		await checkUser(req);

		// define validation schema
		const schema = Joi.object({
			tradingAccountId: Joi.string().required().label("tradingAccount Id"),
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

export async function validateUpdateTradingAccountRequest(
	req: Request,
	res: Response,
	next: NextFunction
) {
	try {
		await checkUser(req);

		// Define regex for API key and secret validation
		const apiKeyRegex = /^[A-Za-z0-9]{64}$/;

		// define validation schemas
		const paramsSchema = Joi.object({
			tradingAccountId: Joi.string().required().label("Trading Account ID"),
		});

		const bodySchema = Joi.object({
			userId: Joi.string().required().label("User ID"),
			platformName: Joi.string().required().label("Platform Name"),
			platformId: Joi.number().required().label("Platform ID"),
			platformLogo: Joi.string().required().label("Platform Logo"),
			apiKey: Joi.string().pattern(apiKeyRegex).required().label("API Key").messages({
				"string.pattern.base": "API Key is invalid",
			}),
			apiSecret: Joi.string().pattern(apiKeyRegex).required().label("API Secret").messages({
				"string.pattern.base": "API Secret is invalid",
			}),
			category: Joi.string()
				.valid(...Object.values(Category))
				.required()
				.label("Category"),
			connectionType: Joi.string()
				.valid(...Object.values(ConnectionType))
				.required()
				.label("Connection Type"),
		});

		// validate request parameters and body
		const paramsValidation = paramsSchema.validate(req.params);
		const bodyValidation = bodySchema.validate(req.body);

		if (paramsValidation.error) {
			const error = paramsValidation.error;
			error.message = error.message.replace(/\"/g, ""); // Strip string of quotes
			next(error);
			throw error;
		}

		if (bodyValidation.error) {
			const error = bodyValidation.error;
			error.message = error.message.replace(/\"/g, ""); // Strip string of quotes
			next(error);
			throw error;
		}

		next();
	} catch (err: any) {
		next(err);
	}
}
