import { Router } from "express";
import {
	handleTradingAccountManualConnection,
	handleDeleteUserTradingAccount,
	handleGetUserTradingAccount,
	handleGetUserTradingAccounts,
	handleAddFundToTradingAccount,
} from "../controllers/UserTradingAccountController";
import {
	validateTradingAccountManualConnectionRequest,
	validateDeleteUserTradingAccountRequest,
	validateGetUserTradingAccountsRequest,
	validateGetUserTradingAccountRequest,
	validateRefreshTradingAccountManualConnectionRequest,
	validateAddFundToTradingAccountRequest,
} from "../middlewares/UserTradingAccountMiddleware";

const router = Router();

// Define routes for user trading accounts
router.post(
	"/connect/manual",
	validateTradingAccountManualConnectionRequest,
	handleTradingAccountManualConnection
);
router.post(
	"/refresh/manual",
	validateRefreshTradingAccountManualConnectionRequest,
	handleTradingAccountManualConnection
);
router.patch("/delete", validateDeleteUserTradingAccountRequest, handleDeleteUserTradingAccount);
router.patch("/add-fund", validateAddFundToTradingAccountRequest, handleAddFundToTradingAccount);
router.get("/one", validateGetUserTradingAccountRequest, handleGetUserTradingAccount);
router.get("/all", validateGetUserTradingAccountsRequest, handleGetUserTradingAccounts);

export default router;
