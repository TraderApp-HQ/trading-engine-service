import { NextFunction, Request, Response } from "express";
import { HttpStatus } from "../utils/httpStatus";
import { apiResponseHandler } from "@traderapp/shared-resources";
import { ResponseType } from "../config/constants";
import { TradeService } from "../services/TradeService";
import { ICreateMasterTrade } from "../models/MasterTrade";
import { deleteFile, uploadFile } from "../utils/s3FileService";
import { v4 as uuidv4 } from "uuid";

export async function getMasterTradesHandler(req: Request, res: Response, next: NextFunction) {
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

export async function getUserTradesHandler(req: Request, res: Response, next: NextFunction) {
	const tradeService = new TradeService();
	const userId = req.body.user.id;
	try {
		const activeUserTrades = await tradeService.getUserActiveTrades({ userId });
		res.status(HttpStatus.OK).json(
			apiResponseHandler({
				type: ResponseType.SUCCESS,
				object: activeUserTrades,
			})
		);
	} catch (error) {
		next(error);
	}
}

export async function getTradeByIdHandler(req: Request, res: Response, next: NextFunction) {
	const tradeService = new TradeService();
	try {
		const { id } = req.params;

		// Fetch trade using the service method
		const trade = await tradeService.getTradeById(id);

		if (!trade) {
			res.status(HttpStatus.NOT_FOUND).json(
				apiResponseHandler({
					type: ResponseType.ERROR,
					message: "Trade not found.",
				})
			);
		}

		res.status(HttpStatus.OK).json(
			apiResponseHandler({
				type: ResponseType.SUCCESS,
				message: "Trade fetched successfully.",
				object: trade,
			})
		);
	} catch (error) {
		next(error);
	}
}

export async function createMasterTradesHandler(req: Request, res: Response, next: NextFunction) {
	const tradeService = new TradeService();

	let uploadedChartUrl: string | boolean = false;
	// generate id for chart upload
	const id = uuidv4();
	try {
		// get file from base64 string
		const chartUrl = req.body?.chartUrl as string;
		const file = Buffer.from(chartUrl, "base64");

		// Upload chart image to s3 storage
		uploadedChartUrl = await uploadFile(file, id);

		if (!uploadedChartUrl) throw new Error("Chart image failed to upload");

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
			chartUrl: uploadedChartUrl,
			tradeNote: req.body.tradeNote,
			pair: req.body.pair,
			side: req.body.side,
			status: req.body.status,
			estimatedLoss: req.body.estimatedLoss,
			estimatedProfit: req.body.estimatedProfit,
			accountType: req.body.accountType,
			orderPlacementType: req.body.orderPlacementType,
			supportedTradingPlatforms: req.body.supportedTradingPlatforms,
			candlestick: req.body.candlestick,
			risk: req.body.risk,
			category: req.body.category,
		};

		const createdMasterTrade = await tradeService.createMasterTrade(newTrade);

		res.status(HttpStatus.CREATED).json(
			apiResponseHandler({
				type: ResponseType.SUCCESS,
				object: createdMasterTrade,
				message: "Trade created successfully.",
			})
		);
	} catch (error) {
		// delete uploaded chart image if it was uploaded
		if (uploadedChartUrl) {
			await deleteFile(id);
		}

		next(error);
	}
}
