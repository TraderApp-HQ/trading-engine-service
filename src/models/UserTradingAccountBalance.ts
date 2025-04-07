import mongoose, { Schema, Document } from "mongoose";
import { AccountType, Currency, TradingPlatform } from "../config/enums";

export interface IUserTradingAccountBalance extends Document {
	userId: string; // Reference to the user
	platformName: TradingPlatform;
	platformId: number;
	currency: Currency;
	accountType: AccountType;
	availableBalance: number;
	lockedBalance?: number; // Locked balance (e.g., in open orders)
	tradingAccountId: mongoose.Types.ObjectId; // reference to the user-trading-account _id
}

const UserTradingAccountBalanceSchema = new Schema<IUserTradingAccountBalance>(
	{
		userId: { type: String, required: true },
		tradingAccountId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "user-trading-account",
			required: true,
		},
		platformName: {
			type: String,
			enum: TradingPlatform,
			required: true,
		},
		platformId: { type: Number, required: true },
		currency: {
			type: String,
			enum: Currency,
			// default: Currency.USDT,
		},
		accountType: {
			type: String,
			enum: AccountType,
			// default: AccountType.SPOT,
		},
		availableBalance: { type: Number, required: true },
		lockedBalance: { type: Number, required: true },
	},
	{ versionKey: false, timestamps: true }
);

UserTradingAccountBalanceSchema.index({
	userId: 1,
	tradingAccountId: 1,
	platformName: 1,
	platformId: 1,
	currency: 1,
	accountType: 1,
});

export default mongoose.model<IUserTradingAccountBalance>(
	"user-trading-account-balance",
	UserTradingAccountBalanceSchema
);
