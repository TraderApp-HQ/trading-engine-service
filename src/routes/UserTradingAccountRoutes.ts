import { Router } from "express";
import {
	handleTradingAccountManualConnection,
	handleDeleteUserTradingAccount,
	handleGetUserTradingAccount,
	handleGetUserTradingAccounts,
	// handleUpdateTradingAccount,
} from "../controllers/UserTradingAccountController";
import {
	validateTradingAccountManualConnectionRequest,
	validateDeleteUserTradingAccountRequest,
	validateGetUserTradingAccountsRequest,
	validateGetUserTradingAccountRequest,
} from "../middlewares/UserTradingAccountMiddleware";

const router = Router();

// Define routes for user trading accounts
router.post(
	"/connect/manual",
	validateTradingAccountManualConnectionRequest,
	handleTradingAccountManualConnection
);
router.patch("/delete", validateDeleteUserTradingAccountRequest, handleDeleteUserTradingAccount);
// router.patch("/update", validateUpdateTradingAccountRequest, handleUpdateTradingAccount);
router.get("/one", validateGetUserTradingAccountRequest, handleGetUserTradingAccount);
router.get("/all", validateGetUserTradingAccountsRequest, handleGetUserTradingAccounts);

export default router;
