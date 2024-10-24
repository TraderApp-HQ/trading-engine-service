import { Router } from "express";
import {
	handleAddTradingAccount,
	handleDeleteAccount,
} from "../controllers/UserTradingAccountController";
import {
	validateAddTradingAccountRequest,
	validateDeleteTradingAccountRequest,
} from "../middlewares/UserTradingAccountMiddleware";

const router = Router();

// Define routes for user trading accounts
router.post("/add", validateAddTradingAccountRequest, handleAddTradingAccount);
router.delete("/delete/:id", validateDeleteTradingAccountRequest, handleDeleteAccount);

export default router;
