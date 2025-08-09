// define trading rules model

import mongoose, { Schema, Document } from "mongoose";
import { TradingPlatform } from "../config/enums";

export interface IPlatformTradingRule extends Document {
	id: string;
	pair: string;
	baseAsset: string;
	quoteCurrency: string;
	minQuantity: number;
	stepSize?: number;
	minNotional: number;
	platform: TradingPlatform;
	createdAt: Date;
	updatedAt: Date;
}

const PlatformTradingRuleSchema = new Schema<IPlatformTradingRule>(
	{
		pair: { type: String, required: true },
		baseAsset: { type: String, required: true },
		quoteCurrency: { type: String, required: true },
		minQuantity: { type: Number, required: true },
		stepSize: { type: Number },
		minNotional: { type: Number },
		platform: { type: String, enum: Object.values(TradingPlatform), required: true },
	},
	{ versionKey: false, timestamps: true }
);

// Override the toJSON method to map _id to id
PlatformTradingRuleSchema.set("toJSON", {
	transform: (doc, ret) => {
		ret.id = ret._id;
		delete ret._id;
		delete ret.__v;
		return ret;
	},
});

PlatformTradingRuleSchema.index({
	pair: 1,
	baseAsset: 1,
	quoteCurrency: 1,
	platform: 1,
});

export const PlatformTradingRule = mongoose.model<IPlatformTradingRule>(
	"platform-trading-rule",
	PlatformTradingRuleSchema
);
