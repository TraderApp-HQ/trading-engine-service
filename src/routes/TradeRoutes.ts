import { Router } from "express";
import {
	validateCreateTradeRequest,
	validateGetTradesRequest,
} from "../middlewares/TradeMiddleware";
import { createTradesHandler, getTradesHandler } from "../controllers/TradeController";

const router = Router();

router.get("/", validateGetTradesRequest, getTradesHandler);
router.post("/", validateCreateTradeRequest, createTradesHandler);

export default router;
