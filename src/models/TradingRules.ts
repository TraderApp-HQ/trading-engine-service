// define trading rules model

import mongoose, { Schema, Document } from "mongoose";
import { TradingRuleCategory, TradingRuleType } from "../config/enums";

export interface ITradingRule extends Document {
	id: string;
	name: string;
	description: string;
	tooltip: string;
	category: TradingRuleCategory;
	type: TradingRuleType;
	value: number | string;
	isEnabled: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const TradingRuleSchema = new Schema<ITradingRule>(
	{
		name: { type: String, required: true },
		description: { type: String, required: true },
		tooltip: { type: String, required: true },
		category: { type: String, enum: Object.values(TradingRuleCategory), required: true },
		type: { type: String, enum: Object.values(TradingRuleType), required: true },
		value: { type: Schema.Types.Mixed, required: true },
		isEnabled: { type: Boolean, default: true },
	},
	{ versionKey: false, timestamps: true }
);

// Override the toJSON method to map _id to id
TradingRuleSchema.set("toJSON", {
	transform: (doc, ret) => {
		ret.id = ret._id;
		delete ret._id;
		delete ret.__v;
		return ret;
	},
});

TradingRuleSchema.index({
	category: 1,
	type: 1,
	isEnabled: 1,
	createdAt: 1,
});

export const TradingRule = mongoose.model<ITradingRule>("trading-rule", TradingRuleSchema);
