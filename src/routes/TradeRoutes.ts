import { Router } from "express";
import {
	validateCreateTradeRequest,
	validateGetTradeByIdRequest,
	validateGetTradesRequest,
} from "../middlewares/TradeMiddleware";
import {
	createMasterTradesHandler,
	getMasterTradesHandler,
	getTradeByIdHandler,
	getUserTradesHandler,
} from "../controllers/TradeController";

const router = Router();

router.get("/master-trade", validateGetTradesRequest, getMasterTradesHandler);
router.get("/user-trade", validateGetTradesRequest, getUserTradesHandler);
router.get("/master-trade/:id", validateGetTradeByIdRequest, getTradeByIdHandler);
router.post("/master-trade", validateCreateTradeRequest, createMasterTradesHandler);

export default router;
