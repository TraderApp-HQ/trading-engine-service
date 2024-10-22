import { Router } from "express";
import {
	handleCreateAccount,
	handleDeleteAccount,
} from "../controllers/UserTradingAccountController";

const router = Router();

// Define routes for user trading accounts
router.post("/create", handleCreateAccount);
router.delete("/delete/:id", handleDeleteAccount);

export default router;
