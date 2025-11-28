import { NextFunction, Request, Response } from "express";
import { checkAdmin, checkUser } from "../utils/tokens";
import Joi from "joi";
import {
	CandleStick,
	Category,
	TradeRisk,
	TradeSide,
	TradeStatus,
	TradingPlatform,
} from "../config/enums";
import { DEFAULT_PAGE, DEFAULT_ROWS_PER_PAGE } from "../config/constants";

export async function validateGetTradesRequest(req: Request, res: Response, next: NextFunction) {
	try {
		// check user
		const user = await checkUser(req);
		req.body.user = user;
		next();
	} catch (err: any) {
		next(err);
	}
}

export async function validateCreateTradeRequest(req: Request, res: Response, next: NextFunction) {
	try {
		// check accessToken && Admin status
		await checkAdmin(req);

		// Joi schema to validate request body
		const masterTradeSchema = Joi.object({
			signalId: Joi.string().optional().label("Signal ID"),
			baseAsset: Joi.string().required().label("Base Asset"),
			baseAssetLogoUrl: Joi.string().required().label("Base Asset Logo Url"),
			baseQuantity: Joi.number().required().label("Base Quantity"),
			currentPrice: Joi.number().required().label("Current Price"),
			entryPrice: Joi.number().required().label("Entry price"),
			stopLossPrice: Joi.number().required().label("Stop Loss Price"),
			takeProfitPrice: Joi.number().optional().label("Take Profit Price"),
			ordersTriggerPrice: Joi.number().required().label("Orders Trigger Price"),
			targetOrdersAmountToFill: Joi.number().required().label("Target orders amount to fill"),
			chartUrl: Joi.string().required().label("Chart url"),
			tradeNote: Joi.string().label("Trade note"),
			quoteCurrency: Joi.string().required().label("Quote Currency"),
			quoteTotal: Joi.number().required().label("Quote Total"),
			pair: Joi.string().required().label("Trade note"),
			side: Joi.string()
				.valid(...Object.values(TradeSide))
				.required()
				.label("Trade side"),
			estimatedProfit: Joi.number().required().label("Estimated profit value"),
			estimatedLoss: Joi.number().required().label("Estimated loss value"),
			status: Joi.string()
				.valid(...Object.values(TradeStatus))
				.required()
				.label("Trade status"),
			orderPlacementType: Joi.string().required().label("Order placement type"),
			accountType: Joi.string().required().label("Account type"),
			supportedTradingPlatforms: Joi.array()
				.items(
					Joi.string()
						.valid(...Object.values(TradingPlatform))
						.required()
				)
				.min(1)
				.required()
				.label("Supported trading platforms"),
			candlestick: Joi.string()
				.valid(...Object.values(CandleStick))
				.required()
				.label("Candlestick"),
			risk: Joi.string()
				.valid(...Object.values(TradeRisk))
				.required()
				.label("Risk"),
			category: Joi.string()
				.valid(...Object.values(Category))
				.required()
				.label("Category"),
		});

		const { error } = masterTradeSchema.validate(req.body);

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

export async function validateGetTradeByIdRequest(
	req: Request,
	_res: Response,
	next: NextFunction
) {
	try {
		// Validate user
		await checkUser(req);

		const paramsSchema = Joi.object({
			id: Joi.string().required().label("Trade ID"),
		});
		const { error, value } = paramsSchema.validate(req.params, {
			abortEarly: true,
		});

		req.params = value;

		if (error) {
			error.message = error.message.replace(/\"/g, "");
			next(error);
			return;
		}

		next();
	} catch (err: any) {
		next(err);
	}
}

// A function to validate request to get trade assets
export async function validateGetTradeAssetsRequest(
	req: Request,
	res: Response,
	next: NextFunction
) {
	try {
		// check accessToken and user role
		await checkUser(req);
		const querySchema = Joi.object({
			category: Joi.string()
				.valid(...Object.values(Category))
				.required()
				.label("Category"),
			page: Joi.number().integer().min(1).positive().default(1).label("page"),
			rowsPerPage: Joi.number()
				.integer()
				.min(1)
				.positive()
				.default(1000)
				.label("Rows per page"),
			sortBy: Joi.string().label("rank"),
			orderBy: Joi.string().label("asc"),
		});
		const { error, value } = querySchema.validate(req.query, {
			abortEarly: true,
		});

		req.query = value;

		if (error) {
			error.message = error.message.replace(/\"/g, "");
			next(error);
			return;
		}

		next();
	} catch (err: any) {
		next(err);
	}
}

export async function validateCurrenciesRequest(req: Request, res: Response, next: NextFunction) {
	try {
		// check accessToken and user role
		await checkUser(req);
		next();
	} catch (err: any) {
		next(err);
	}
}

export async function validateGetSupportedTradingPlatformsRequest(
	req: Request,
	_res: Response,
	next: NextFunction
) {
	try {
		// check accessToken and user role
		await checkAdmin(req);

		const querySchema = Joi.object({
			quoteCurrencyId: Joi.number().required().label("Quote Currency Id"),
			baseAssetId: Joi.number().required().label("Base Asset Id"),
		});
		const { error } = querySchema.validate(req.query, { abortEarly: true });

		if (error) {
			error.message = error.message.replace(/\"/g, "");
			next(error);
			return;
		}
		next();
	} catch (err: any) {
		next(err);
	}
}

export async function validateGetTradeCurrentPriceRequest(
	req: Request,
	_res: Response,
	next: NextFunction
) {
	try {
		// Check accessToken and admin role
		await checkAdmin(req);

		const querySchema = Joi.object({
			asset: Joi.string().required().label("Asset"),
			quote: Joi.string().required().label("Quote"),
		});

		// Validate req.query
		const { error, value } = querySchema.validate(req.query, {
			abortEarly: true,
		});

		if (error) {
			error.message = error.message.replace(/\"/g, "");
			next(error);
			return;
		}

		// Additional validation to reject "undefined" string values
		if (value.asset === "undefined" || value.quote === "undefined") {
			const error = new Error("Asset and quote parameters cannot be 'undefined'");
			next(error);
			return;
		}

		req.query = value;

		next();
	} catch (err: any) {
		next(err);
	}
}

export async function validateAccountTradingPlatformsRequest(
	req: Request,
	_res: Response,
	next: NextFunction
) {
	try {
		// check accessToken and user role
		await checkUser(req);

		const querySchema = Joi.object({
			rowsPerPage: Joi.number()
				.integer()
				.min(1)
				.positive()
				.default(DEFAULT_ROWS_PER_PAGE)
				.label("Row per page"),
			page: Joi.number().integer().min(1).default(DEFAULT_PAGE).label("Page"),
			orderBy: Joi.string().label("asc"),
			status: Joi.string()
				.valid(...Object.values(TradeStatus))
				.label("status"),
		});
		const { error } = querySchema.validate(req.query, { abortEarly: true });

		if (error) {
			error.message = error.message.replace(/\"/g, "");
			next(error);
			return;
		}
		next();
	} catch (err: any) {
		next(err);
	}
}

export async function validateMasterTradeTpAndSlUpdateRequest(
	req: Request,
	res: Response,
	next: NextFunction
) {
	try {
		// check accessToken && Admin status
		await checkAdmin(req);

		// Joi schema to validate request param
		const paramsSchema = Joi.object({
			id: Joi.string().required().label("Master Trade ID"),
		});

		// Joi schema to validate request query
		const querySchema = Joi.object({
			stopLoss: Joi.number().min(0).positive().required().label("Stop Loss Price"),
			takeProfit: Joi.number().min(0).positive().optional().label("Take Profit Price"),
		});

		const paramsResult = paramsSchema.validate(req.params, { abortEarly: true });
		const queryResult = querySchema.validate(req.query, { abortEarly: true });

		if (paramsResult.error || queryResult.error) {
			const validationError = paramsResult.error ?? queryResult.error;
			if (validationError) {
				validationError.message = validationError.message.replace(/\"/g, "");

				next(validationError);
			}
		}

		req.params = paramsResult.value;
		req.query = queryResult.value;

		next();
	} catch (err: any) {
		next(err);
	}
}
