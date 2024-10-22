import mongoose, { Schema, Document } from "mongoose";
import { AccountType, Currency, Exchange } from "../config/enums";

export interface IUserTradingAccountBalance extends Document {
	userId: string; // Reference to the user
	exchange: Exchange;
	currency: Currency;
	accountType: AccountType;
	free: number; // Free balance
	locked: number; // Locked balance (e.g., in open orders)
	createdAt: Date;
	updatedAt: Date;
}

const UserTradingAccountBalanceSchema = new Schema<IUserTradingAccountBalance>({
	userId: { type: String, required: true },
	exchange: {
		type: String,
		enum: Exchange,
		default: Exchange.BINANCE,
	},
	currency: {
		type: String,
		enum: Currency,
		default: Currency.USDT,
	},
	accountType: {
		type: String,
		enum: AccountType,
		default: AccountType.SPOT,
	},
	free: { type: Number, required: true }, // Free balance
	locked: { type: Number, required: true }, // Locked balance
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model<IUserTradingAccountBalance>(
	"user-trading-account-balance",
	UserTradingAccountBalanceSchema
);
