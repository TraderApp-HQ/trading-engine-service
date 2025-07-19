import mongoose, { Schema, Document, Types } from "mongoose";
import { OrderType, OrderPlacementType, OrderStatus } from "../config/enums"; // Import the enums

export interface IOrder extends Document {
	id: string;
	userId: string;
	tradeId: Types.ObjectId; // reference to the Trade model
	orderBatchId: Types.ObjectId; // reference to the OrderBatch model
	baseAsset: string;
	baseQuantity: number;
	type: OrderType;
	placementType: OrderPlacementType;
	price: number;
	total: number;
	quoteCurrency: string;
	quoteTotal: number;
	status: OrderStatus;
	// createdAt: string;
	// updatedAt: string
}

const OrderSchema = new Schema<IOrder>(
	{
		// orderId: { type: String, unique: true, required: true },
		userId: { type: String, required: true },
		tradeId: { type: Schema.Types.ObjectId, ref: "trade", required: true },
		orderBatchId: { type: Schema.Types.ObjectId, ref: "order-batch", required: true },
		baseAsset: { type: String, required: true },
		baseQuantity: { type: Number, required: true },
		type: { type: String, enum: Object.values(OrderType), required: true },
		placementType: { type: String, enum: Object.values(OrderPlacementType), required: true },
		price: { type: Number, required: true },
		total: { type: Number, required: true },
		quoteCurrency: { type: String, required: true },
		quoteTotal: { type: Number, required: true },
		status: { type: String, enum: Object.values(OrderStatus), required: true },
		// createdAt: { type: Date, default: Date.now },
		// updatedAt: { type: Date, default: Date.now },
	},
	{ versionKey: false, timestamps: true }
);

// Override the toJSON method to map _id to id
OrderSchema.set("toJSON", {
	transform: (doc, ret) => {
		ret.id = ret._id;
		delete ret._id;
		delete ret.__v;
		return ret;
	},
});

OrderSchema.index({
	// orderId: 1,
	userId: 1,
	tradeId: 1,
	baseAsset: 1,
	quoteCurrency: 1,
	type: 1,
	placementType: 1,
	status: 1,
	createdAt: 1,
});

export const Order = mongoose.model<IOrder>("order", OrderSchema);
