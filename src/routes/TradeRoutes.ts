import { Router } from "express";
import {
	validateAccountTradingPlatformsRequest,
	validateCloseActiveMasterTradeRequest,
	validateCreateTradeRequest,
	validateCurrenciesRequest,
	validateGetSupportedTradingPlatformsRequest,
	validateGetTradeAssetsRequest,
	validateGetTradeByIdRequest,
	validateGetTradeCurrentPriceRequest,
	validateGetTradesRequest,
	validateMasterTradeTpAndSlUpdateRequest,
	validateMasterTradeUpdateRequest,
} from "../middlewares/TradeMiddleware";
import {
	breakEvenMasterTrade,
	cancelMasterTrade,
	closeActiveMasterTrade,
	createMasterTradesHandler,
	getAllAccountTradingPlatforms,
	getAllSupportedCurrencies,
	getAllTradeAssets,
	getMasterTradesHandler,
	getSupportedTradingPlatforms,
	getTradeByIdHandler,
	getTradeCurrentPrice,
	getUserTradesHandler,
	triggerMasterTradeOrderPlacement,
	updateMasterTradeTpAndSl,
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
router.patch(
	"/master-trade/set-tp-sl/:id",
	validateMasterTradeTpAndSlUpdateRequest,
	updateMasterTradeTpAndSl
);
router.patch(
	"/master-trade/close-active-trade/:id",
	validateCloseActiveMasterTradeRequest,
	closeActiveMasterTrade
);
router.patch("/master-trade/cancel-trade/:id", validateMasterTradeUpdateRequest, cancelMasterTrade);
router.patch(
	"/master-trade/break-even/:id",
	validateMasterTradeUpdateRequest,
	breakEvenMasterTrade
);
router.patch(
	"/master-trade/trigger-order-placement/:id",
	validateMasterTradeUpdateRequest,
	triggerMasterTradeOrderPlacement
);

export default router;
