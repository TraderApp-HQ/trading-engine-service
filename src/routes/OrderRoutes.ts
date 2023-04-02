import { Router } from "express";
import { getOrders, getOrder, placeOrder, cancelOrder } from "../controllers/OrderControllers";
import {
	validateOrderRequest,
	validateUserBalance,
	validateUserTradingRules,
} from "../middlewares/OrderMiddlewares";

const router = Router();

router.get("/", getOrders);
router.get("/:id", getOrder);
router.post("/", validateOrderRequest, validateUserBalance, validateUserTradingRules, placeOrder);
router.delete("/:id", cancelOrder);

export default router;
