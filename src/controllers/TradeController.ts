import { NextFunction, Request, Response } from "express";
import { HttpStatus } from "../utils/httpStatus";
import { apiResponseHandler } from "@traderapp/shared-resources";
import { ResponseType } from "../config/constants";
import { TradeService } from "../services/TradeService";
import { ICreateMasterTrade } from "../models/MasterTrade";

export async function getTradesHandler(req: Request, res: Response, next: NextFunction) {
	const tradeService = new TradeService();
	try {
		const activeMasterTrades = await tradeService.getActiveMasterTrades();
		res.status(HttpStatus.OK).json(
			apiResponseHandler({
				type: ResponseType.SUCCESS,
				object: activeMasterTrades,
			})
		);
	} catch (error) {
		next(error);
	}
}

export async function createTradesHandler(req: Request, res: Response, next: NextFunction) {
	const tradeService = new TradeService();
	try {
		const newTrade: ICreateMasterTrade = {
			signalId: req.body?.signalId,
			baseAsset: req.body.baseAsset,
			baseAssetLogoUrl: req.body.baseAssetLogoUrl,
			quoteCurrency: req.body.quoteCurrency,
			baseQuantity: req.body.baseQuantity,
			quoteTotal: req.body.quoteTotal,
			currentPrice: req.body.currentPrice,
			entryPrice: req.body.entryPrice,
			stopLossPrice: req.body.stopLossPrice,
			takeProfitPrice: req.body.takeProfitPrice,
			ordersTriggerPrice: req.body.ordersTriggerPrice,
			targetOrdersAmountToFill: req.body.targetOrdersAmountToFill,
			chartUrl: req.body.chartUrl,
			tradeNote: req.body.tradeNote,
			pair: req.body.pair,
			side: req.body.tradeSide,
			pnl: req.body.pnl,
			pnlPercentage: req.body.pnlPercentage,
			status: req.body.status,
			supportedTradingPlatforms: req.body.supportedTradingPlatforms,
			estimatedProfit: req.body.estimatedProfit,
			estimatedLoss: req.body.estimatedLoss,
		};

		const activeTrades = await tradeService.createTrade(newTrade);

		res.status(HttpStatus.CREATED).json(
			apiResponseHandler({
				type: ResponseType.SUCCESS,
				object: activeTrades,
				message: "Trade created successfully.",
			})
		);
	} catch (error) {
		next(error);
	}
}
