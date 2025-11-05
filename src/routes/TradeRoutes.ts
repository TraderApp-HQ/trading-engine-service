import { Router } from "express";
import {
	validateAccountTradingPlatformsRequest,
	validateCreateTradeRequest,
	validateCurrenciesRequest,
	validateGetSupportedTradingPlatformsRequest,
	validateGetTradeAssetsRequest,
	validateGetTradeByIdRequest,
	validateGetTradeCurrentPriceRequest,
	validateGetTradesRequest,
} from "../middlewares/TradeMiddleware";
import {
	createMasterTradesHandler,
	getAllAccountTradingPlatforms,
	getAllSupportedCurrencies,
	getAllTradeAssets,
	getMasterTradesHandler,
	getSupportedTradingPlatforms,
	getTradeByIdHandler,
	getTradeCurrentPrice,
	getUserTradesHandler,
} from "../controllers/TradeController";

const router = Router();

router.get("/trade-assets", validateGetTradeAssetsRequest, getAllTradeAssets);
router.get("/supported-currencies", validateCurrenciesRequest, getAllSupportedCurrencies);
router.get(
	"/supported-trading-platforms",
	validateGetSupportedTradingPlatformsRequest,
	getSupportedTradingPlatforms
);
router.get(
	"/account-trading-platforms",
	validateAccountTradingPlatformsRequest,
	getAllAccountTradingPlatforms
);
router.get("/trade-current-price", validateGetTradeCurrentPriceRequest, getTradeCurrentPrice);
router.get("/master-trade", validateGetTradesRequest, getMasterTradesHandler);
router.get("/user-trade", validateGetTradesRequest, getUserTradesHandler);
router.get("/master-trade/:id", validateGetTradeByIdRequest, getTradeByIdHandler);
router.post("/master-trade", validateCreateTradeRequest, createMasterTradesHandler);

export default router;
