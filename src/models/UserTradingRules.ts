// define user trading rules model

import mongoose, { Schema, Document } from "mongoose";
import { TradingRuleCategory, TradingRuleType } from "../config/enums";

export interface IUserTradingRule extends Document {
	id: string;
	userId: string;
	ruleId: string; // Reference to TradingRule id (will be the _id as string)
	name: string;
	description: string;
	tooltip: string;
	category: TradingRuleCategory;
	type: TradingRuleType;
	value: number | string;
	isEnabled: boolean;
	isCustomized: boolean; // Flag to indicate if user has modified from default
	lastResetToDefault: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

const UserTradingRuleSchema = new Schema<IUserTradingRule>(
	{
		userId: { type: String, required: true },
		ruleId: { type: String, required: true }, // Reference to TradingRule _id as string
		name: { type: String, required: true },
		description: { type: String, required: true },
		tooltip: { type: String, required: true },
		category: { type: String, enum: Object.values(TradingRuleCategory), required: true },
		type: { type: String, enum: Object.values(TradingRuleType), required: true },
		value: { type: Schema.Types.Mixed, required: true },
		isEnabled: { type: Boolean, default: true },
		isCustomized: { type: Boolean, default: false },
		lastResetToDefault: { type: Date, default: null },
	},
	{ versionKey: false, timestamps: true }
);

// Override the toJSON method to map _id to id
UserTradingRuleSchema.set("toJSON", {
	transform: (doc, ret) => {
		ret.id = ret._id;
		delete ret._id;
		delete ret.__v;
		return ret;
	},
});

// Compound index for user-specific rule lookups
UserTradingRuleSchema.index({ userId: 1, ruleId: 1 }, { unique: true });

// Additional indexes for common queries
UserTradingRuleSchema.index({
	userId: 1,
	category: 1,
	isEnabled: 1,
});

UserTradingRuleSchema.index({
	userId: 1,
	isCustomized: 1,
});

export const UserTradingRule = mongoose.model<IUserTradingRule>(
	"user-trading-rule",
	UserTradingRuleSchema
);
