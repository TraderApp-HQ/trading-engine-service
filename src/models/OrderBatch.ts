import mongoose, { Schema, Document } from "mongoose";
import { OrderBatchStatus, TradingPlatform } from "../config/enums";

export interface IOrderBatch extends Document {
	// batchId: string;
	orderId: mongoose.Types.ObjectId; // reference to order _id
	baseAsset: string;
	quoteCurrency: string;
	baseQuantity: number;
	quoteTotal: number;
	status: OrderBatchStatus;
	tradingAccountId: mongoose.Types.ObjectId; // reference to the user-trading-account _id
	platformName: TradingPlatform;
	platformId: number;
	// avgBuyPrice: number;
	// createdAt: Date;
	// updatedAt: Date;
}

const OrderBatchSchema = new Schema<IOrderBatch>(
	{
		// batchId: { type: String, unique: true, required: true },
		orderId: { type: mongoose.Schema.Types.ObjectId, ref: "order", required: true },
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
		// avgBuyPrice: { type: Number, required: true },
		// createdAt: { type: Date, default: Date.now },
		// updatedAt: { type: Date, default: Date.now },
	},
	{ versionKey: false, timestamps: true }
);

OrderBatchSchema.index({
	// batchId: 1,
	orderId: 1,
	tradingAccountId: 1,
	platformName: 1,
	platformId: 1,
	status: 1,
	baseAsset: 1,
	quoteCurrency: 1,
	createdAt: 1,
});

export const OrderBatch = mongoose.model<IOrderBatch>("order-batch", OrderBatchSchema);
