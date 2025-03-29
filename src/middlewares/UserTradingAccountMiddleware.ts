import { Request, Response, NextFunction } from "express";
import { checkAdmin, checkUser } from "../utils/tokens";
import Joi from "joi";
import { AccountType, Category, ConnectionType, Currency, TradingPlatform } from "../config/enums";
import TradingAccountRepository from "../repos/TradingAccountRepo";
import { FeatureFlagManager } from "../utils/helpers/SplitIOClient";
import { ErrorMessage } from "../config/constants";

export async function validateTradingAccountManualConnectionRequest(
	req: Request,
	res: Response,
	next: NextFunction
) {
	try {
		await checkUser(req);

		// Define regex for API key and secret validation
		// const apiKeyRegex = /^[A-Za-z0-9]{64}$/;
		// const apiKeyRegex = /^[A-Za-z0-9]{10,}$/;

		// define validation schema
		const schema = Joi.object({
			userId: Joi.string().required().label("User Id"),
			platformName: Joi.string().required().label("Platform Name"),
			// apiKey: Joi.string().pattern(apiKeyRegex).required().label("API Key").messages({
			// 	"string.pattern.base": "API Key is invalid",
			// }),
			// apiSecret: Joi.string().pattern(apiKeyRegex).required().label("API Secret").messages({
			// 	"string.pattern.base": "API Secret is invalid",
			// }),
			apiKey: Joi.string().required().min(10).label("API Key").messages({
				"string.pattern.base": "API Key is invalid",
			}),
			apiSecret: Joi.string().required().min(10).label("API Secret").messages({
				"string.pattern.base": "API Secret is invalid",
			}),
			passphrase: Joi.string().label("Passphrase"),
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

export async function validateRefreshTradingAccountManualConnectionRequest(
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

		const tradingRepo = new TradingAccountRepository();
		const { apiKey, apiSecret, passphrase } = await tradingRepo.getUserTradingAccount({
			userId: req.body.userId,
			platformName: req.body.platformName,
		});

		req.body.apiKey = apiKey;
		req.body.apiSecret = apiSecret;
		req.body.passphrase = passphrase;
		next();
	} catch (err: any) {
		next(err);
	}
}

export async function validateDeleteUserTradingAccountRequest(
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
		});

		// validate request
		const { error } = schema.validate(req.query);

		if (error) {
			error.message = error.message.replace(/\"/g, "");
			next(error);
		}
		next();
	} catch (err: any) {
		next(err);
	}
}

export async function validateGetUserTradingAccountsRequest(
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
		const { error } = schema.validate(req.query);
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

export async function validateGetUserTradingAccountRequest(
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
		});

		// validate request
		const { error } = schema.validate(req.query);

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

		const bodySchema = Joi.object({
			userId: Joi.string().required().label("User ID"),
			platformName: Joi.string().required().label("Platform Name"),
			// platformId: Joi.number().required().label("Platform ID"),
			// platformLogo: Joi.string().required().label("Platform Logo"),
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

		const bodyValidation = bodySchema.validate(req.body);
		if (bodyValidation.error) {
			const error = bodyValidation.error;
			error.message = error.message.replace(/\"/g, ""); // Strip string of quotes
			next(error);
		}

		next();
	} catch (err: any) {
		next(err);
	}
}

export async function validateAddFundToTradingAccountRequest(
	req: Request,
	res: Response,
	next: NextFunction
) {
	try {
		const userId = req.body.userId as string;
		const featureFlags = new FeatureFlagManager();
		const isFeatureFlagOn = await featureFlags.checkToggleFlag(
			"release-referral-tracking",
			userId
		);

		// Check if feature flag is enabled
		if (!isFeatureFlagOn) {
			const error = new Error("This operation is forbidden.");
			error.name = ErrorMessage.forbidden;
			throw error;
		}

		await checkAdmin(req);

		const bodySchema = Joi.object({
			userId: Joi.string().required().label("User ID"),
			platformName: Joi.string()
				.valid(...Object.values(TradingPlatform))
				.required()
				.label("Platform Name"),
			accountType: Joi.string()
				.valid(...Object.values(AccountType))
				.required()
				.label("Account Type"),
			currency: Joi.string()
				.valid(...Object.values(Currency))
				.required()
				.label("Currency"),
			amount: Joi.number().min(0).required().label("Amount"),
		});

		const { error } = bodySchema.validate(req.body);

		if (error) {
			// strip string of double quotes
			error.message = error.message.replace(/\"/g, "");
			next(error);
			return;
		}

		next();
	} catch (err: any) {
		next(err);
	}
}
