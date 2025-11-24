import mongoose, { Schema, Document } from "mongoose";
import { AccountType, Currency, TradingPlatform } from "../config/enums";

export interface IUserTradingAccountBalance extends Document {
	id: string;
	userId: string; // Reference to the user
	platformName: TradingPlatform;
	platformId: number;
	currency: Currency;
	accountType: AccountType;
	availableBalance: number;
	lockedBalance?: number; // Locked balance (e.g., in open orders)
	tradingAccountId: mongoose.Types.ObjectId; // reference to the user-trading-account _id
	accountSize: number;
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
		accountSize: { type: Number },
	},
	{ versionKey: false, timestamps: true }
);

// Override the toJSON method to map _id to id
UserTradingAccountBalanceSchema.set("toJSON", {
	transform: (doc, ret) => {
		ret.id = ret._id;
		delete ret._id;
		delete ret.__v;
		return ret;
	},
});

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
