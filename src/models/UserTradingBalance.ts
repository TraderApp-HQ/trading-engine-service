import mongoose, { Schema, Document } from "mongoose";
import { AccountType, Currency, Platform } from "../config/enums";

export interface IUserTradingAccountBalance extends Document {
	userId: string; // Reference to the user
	platformName: Platform;
	platformId: number;
	currency: Currency;
	accountType: AccountType;
	availableBalance: number;
	lockedBalance?: number; // Locked balance (e.g., in open orders)
}

const UserTradingAccountBalanceSchema = new Schema<IUserTradingAccountBalance>(
	{
		userId: { type: String, required: true },
		platformName: {
			type: String,
			enum: Platform,
			required: true,
		},
		platformId: { type: Number, required: true },
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
		availableBalance: { type: Number, required: true },
		lockedBalance: { type: Number, required: true },
	},
	{ versionKey: false, timestamps: true }
);

UserTradingAccountBalanceSchema.index({
	userId: 1,
	platformName: 1,
	currency: 1,
	accountType: 1,
});

export default mongoose.model<IUserTradingAccountBalance>(
	"user-trading-account-balance",
	UserTradingAccountBalanceSchema
);
