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
