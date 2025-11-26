import { NextFunction, Request, Response } from "express";
import { HttpStatus } from "../utils/httpStatus";
import { apiResponseHandler } from "@traderapp/shared-resources";
import {
	DEFAULT_PAGE,
	DEFAULT_ROWS_PER_PAGE,
	ResponseMessage,
	ResponseType,
} from "../config/constants";
import { TradeService } from "../services/TradeService";
import { ICreateMasterTrade } from "../models/MasterTrade";
import { deleteFile, uploadFile } from "../utils/s3FileService";
import { v4 as uuidv4 } from "uuid";
import { Category, TradingPlatformStatus } from "../config/enums";
import { IAsset } from "../models/Asset";
import { IPagedResultData } from "../config/interfaces";
import { getTradeAssetCurrentPrice } from "../utils/tradePrice";

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
		const trade = await tradeService.getMasterTradeById(id);

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
			originalBaseQuantity: req.body.baseQuantity,
			quoteTotal: req.body.quoteTotal,
			originalQuoteTotal: req.body.quoteTotal,
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
			originalEstimatedLoss: req.body.estimatedLoss,
			originalEstimatedProfit: req.body.estimatedProfit,
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

export async function getAllTradeAssets(req: Request, res: Response, next: NextFunction) {
	const tradeService = new TradeService();
	try {
		const category = req.query.category as Category;
		const page: number = parseInt(req.query.page as string, 10) || 1;
		let rowsPerPage: number = parseInt(req.query.rowsPerPage as string, 10) || 10;
		rowsPerPage = rowsPerPage > 100 ? 100 : rowsPerPage;

		const orderBy: "asc" | "desc" = (req.query.orderBy as "asc" | "desc") || "asc";
		const sortBy: string = (req.query.sortBy as string) || "rank";

		const tradeAssetsArr = await tradeService.getAllTradeAssets({
			category,
			page,
			rowsPerPage,
			orderBy,
			sortBy,
		});

		if (!tradeAssetsArr) {
			return res.status(404).json(apiResponseHandler({ message: "No assets found." }));
		}

		// Parse URLs back to JS Object. NB: URLs were stored in the DB as strings using JSON.stringify
		const tradeAssets: IAsset[] = tradeAssetsArr.map((asset: any) => {
			const assetObj = asset.toObject ? asset.toObject() : asset;
			return {
				...assetObj,
				urls:
					typeof assetObj.urls === "string"
						? JSON.parse(assetObj.urls as string)
						: assetObj.urls,
				id: asset._id,
			};
		});

		// Assuming you have a method to count the documents, you can include it here.
		// const count = await CoinService.countActiveCoins(); // Implement this method in CoinService
		const count = 10; // Placeholder count value

		const pageCount = Math.ceil(count / rowsPerPage);

		const response: IPagedResultData = {
			currentPage: page,
			itemsCount: count,
			pageCount,
			rowsPerPage,
			sortBy,
			orderBy,
			assets: tradeAssets,
		};

		res.status(HttpStatus.OK).json(
			apiResponseHandler({
				type: ResponseType.SUCCESS,
				object: response,
				message: ResponseMessage.GET_TRADE_ASSETS,
			})
		);
	} catch (err: any) {
		next(err);
	}
}

export async function getAllSupportedCurrencies(req: Request, res: Response, next: NextFunction) {
	const tradeService = new TradeService();
	try {
		const currencies = await tradeService.getSupportedCurrencies();

		res.status(HttpStatus.OK).json(
			apiResponseHandler({
				type: ResponseType.SUCCESS,
				object: currencies,
				message: ResponseMessage.GET_CURRENCIES,
			})
		);
	} catch (err: any) {
		next(err);
	}
}

export async function getSupportedTradingPlatforms(
	req: Request,
	res: Response,
	next: NextFunction
) {
	const tradeService = new TradeService();

	const baseAssetId = Number(req.query.baseAssetId);
	const quoteCurrencyId = Number(req.query.quoteCurrencyId);

	try {
		const platforms = await tradeService.getSupportedTradingPlatforms({
			baseAssetId,
			quoteCurrencyId,
		});

		res.status(HttpStatus.OK).json(
			apiResponseHandler({
				type: ResponseType.SUCCESS,
				object: platforms ?? [],
				message: ResponseMessage.GET_EXCHANGES,
			})
		);
	} catch (error) {
		next(error);
	}
}

export async function getTradeCurrentPrice(req: Request, res: Response, next: NextFunction) {
	try {
		const asset = req.query.asset as string;
		const quote = req.query.quote as string;

		const price = await getTradeAssetCurrentPrice({ asset, quote });

		if (!price) {
			throw new Error(`Fialed to get current price for ${asset}/${quote}`);
		}

		res.status(HttpStatus.OK).json(
			apiResponseHandler({
				type: ResponseType.SUCCESS,
				message: ResponseMessage.TRADE_PRICE,
				object: { price },
			})
		);
	} catch (err) {
		console.log(err);
		next(err);
	}
}

export async function getAllAccountTradingPlatforms(
	req: Request,
	res: Response,
	next: NextFunction
) {
	const tradeService = new TradeService();

	try {
		const page: number = parseInt(req.query.page as string, 10) || DEFAULT_PAGE;
		const rowsPerPage: number = Math.min(
			parseInt(req.query.rowsPerPage as string, 10) || DEFAULT_ROWS_PER_PAGE,
			100
		);
		const orderBy: "asc" | "desc" = (req.query.orderBy as "asc" | "desc") || "asc";

		const status = req.query.status as TradingPlatformStatus;

		const platform = await tradeService.getAllAccountTradingPlatforms({
			page,
			rowsPerPage,
			orderBy,
			status,
		});

		res.status(HttpStatus.OK).json(
			apiResponseHandler({
				type: ResponseType.SUCCESS,
				object: platform,
				message: ResponseMessage.GET_EXCHANGES,
			})
		);
	} catch (error) {
		next(error);
	}
}
