import { Router } from "express";
import {
	handleAddTradingAccount,
	handleDeleteAccount,
	handleGetUserAccountbyId,
	handleGetUserAccountsWithBalances,
	handleUpdateTradingAccount,
} from "../controllers/UserTradingAccountController";
import {
	validateAddTradingAccountRequest,
	validateDeleteTradingAccountRequest,
	validateGetUserAccountsWithBalancesRequest,
	validatehandleGetUserAccountbyIdRequest,
	validateUpdateTradingAccountRequest,
} from "../middlewares/UserTradingAccountMiddleware";

const router = Router();

// Define routes for user trading accounts
router.post("/connect/manual", validateAddTradingAccountRequest, handleAddTradingAccount);
router.patch("/delete/:id", validateDeleteTradingAccountRequest, handleDeleteAccount);
router.patch(
	"/update/:tradingAccountId",
	validateUpdateTradingAccountRequest,
	handleUpdateTradingAccount
);
router.get(
	"/trading/account/:tradingAccountId",
	validatehandleGetUserAccountbyIdRequest,
	handleGetUserAccountbyId
);
router.get(
	"/:userId",
	validateGetUserAccountsWithBalancesRequest,
	handleGetUserAccountsWithBalances
);

export default router;
