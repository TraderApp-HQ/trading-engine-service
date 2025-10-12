import { NextFunction, Request, Response } from "express";
import { checkAdmin, checkUser } from "../utils/tokens";
import Joi from "joi";
import { TradeSide, TradeStatus } from "../config/enums";

export async function validateGetTradesRequest(req: Request, res: Response, next: NextFunction) {
	try {
		// check accessToken
		await checkUser(req);

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
			signalId: Joi.string().label("Signal ID"),
			baseAsset: Joi.string().required().label("Base Asset"),
			baseAssetLogoUrl: Joi.string().required().label("Base Asset Logo Url"),
			quoteCurrency: Joi.string().required().label("Quote Currency"),
			baseQuantity: Joi.number().required().label("Base Quantity"),
			quoteTotal: Joi.number().required().label("Quote Total"),
			currentPrice: Joi.number().required().label("Current Price"),
			entryPrice: Joi.number().required().label("Entry price"),
			stopLossPrice: Joi.number().required().label("Stop Loss Price"),
			takeProfitPrice: Joi.number().optional().label("Take Profit Price"),
			ordersTriggerPrice: Joi.number().required().label("Orders Trigger Price"),
			targetOrdersAmountToFill: Joi.number().required().label("Target orders amount to fill"),
			chartUrl: Joi.string().label("Chart url"),
			tradeNote: Joi.string().label("Trade note"),
			pair: Joi.string().required().label("Trade note"),
			side: Joi.string()
				.valid(...Object.values(TradeSide))
				.required()
				.label("Trade side"),
			pnl: Joi.number().required().label("PnL"),
			pnlPercentage: Joi.number().required().label("PnL Percentage"),
			status: Joi.string()
				.valid(...Object.values(TradeStatus))
				.required()
				.label("Trade status"),
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
