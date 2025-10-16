import mongoose, { Schema, Document } from "mongoose";
import { OrderBatchStatus, TradingPlatform } from "../config/enums";

export interface IOrderBatch extends Document {
	id: string;
	baseAsset: string;
	quoteCurrency: string;
	baseQuantity: number;
	quoteTotal: number;
	status: OrderBatchStatus;
	tradingAccountId: mongoose.Types.ObjectId; // reference to the user-trading-account _id
	platformName: TradingPlatform;
	platformId: number;
	externalOrderId: string; // exchange/broker orderId
	createdAt: Date;
	updatedAt: Date;
}

const OrderBatchSchema = new Schema<IOrderBatch>(
	{
		baseAsset: { type: String, required: true },
		baseQuantity: { type: Number, required: true },
		quoteCurrency: { type: String, required: true },
		quoteTotal: { type: Number, required: true },
		status: { type: String, enum: Object.values(OrderBatchStatus), required: true },
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
		externalOrderId: { type: String, required: true },
	},
	{ versionKey: false, timestamps: true }
);

// Override the toJSON method to map _id to id
OrderBatchSchema.set("toJSON", {
	transform: (doc, ret) => {
		ret.id = ret._id;
		delete ret._id;
		delete ret.__v;
		return ret;
	},
});

OrderBatchSchema.index({
	tradingAccountId: 1,
	platformName: 1,
	platformId: 1,
	status: 1,
	baseAsset: 1,
	quoteCurrency: 1,
	createdAt: 1,
});

export const OrderBatch = mongoose.model<IOrderBatch>("order-batch", OrderBatchSchema);
