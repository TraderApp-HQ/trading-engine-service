import mongoose, { Schema, Document } from "mongoose";
import { AccountType, Currency, Exchange } from "../config/enums";

export interface IUserTradingAccountBalance extends Document {
	userId: string; // Reference to the user
	exchangeName: Exchange;
	exchangeId: number;
	currency: Currency;
	accountType: AccountType;
	free: number; // Free balance
	lockedBalance: number; // Locked balance (e.g., in open orders)
}

const UserTradingAccountBalanceSchema = new Schema<IUserTradingAccountBalance>(
	{
		userId: { type: String, required: true },
		exchangeName: {
			type: String,
			enum: Exchange,
			required: true,
		},
		exchangeId: { type: Number, required: true },
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
		lockedBalance: { type: Number, required: true },
	},
	{ versionKey: false, timestamps: true }
);

UserTradingAccountBalanceSchema.index({
	userId: 1,
	exchangeName: 1,
	currency: 1,
	accountType: 1,
});

export default mongoose.model<IUserTradingAccountBalance>(
	"user-trading-account-balance",
	UserTradingAccountBalanceSchema
);
