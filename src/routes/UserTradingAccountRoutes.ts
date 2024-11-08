import { Router } from "express";
import {
	handleAddTradingAccount,
	handleDeleteAccount,
	handleGetUserAccountsWithBalances,
} from "../controllers/UserTradingAccountController";
import {
	validateAddTradingAccountRequest,
	validateDeleteTradingAccountRequest,
	validateGetUserAccountWithBalancesRequest,
} from "../middlewares/UserTradingAccountMiddleware";

const router = Router();

// Define routes for user trading accounts
router.post("/connect/manual", validateAddTradingAccountRequest, handleAddTradingAccount);
router.patch("/delete/:id", validateDeleteTradingAccountRequest, handleDeleteAccount);
router.get(
	"/:userId",
	validateGetUserAccountWithBalancesRequest,
	handleGetUserAccountsWithBalances
);

export default router;
