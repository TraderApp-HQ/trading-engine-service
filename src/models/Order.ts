import mongoose, { Schema, Document, Types } from "mongoose";
import { OrderType, OrderPlacementType, OrderStatus, OrderSide } from "../config/enums"; // Import the enums

export interface IOrder extends Document {
	id: string;
	userId: string;
	tradeId: Types.ObjectId; // reference to the Trade model
	orderBatchId: Types.ObjectId; // reference to the OrderBatch model
	baseAsset: string;
	baseQuantity: number;
	orderType: OrderType;
	orderSide: OrderSide;
	placementType: OrderPlacementType;
	price: number;
	total: number;
	quoteCurrency: string;
	quoteTotal: number;
	status: OrderStatus;
	externalOrderId: string; // exchange/broker orderId
	createdAt: Date;
	updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
	{
		// orderId: { type: String, unique: true, required: true },
		userId: { type: String, required: true },
		tradeId: { type: Schema.Types.ObjectId, ref: "trade", required: true },
		orderBatchId: { type: Schema.Types.ObjectId, ref: "order-batch", required: true },
		baseAsset: { type: String, required: true },
		baseQuantity: { type: Number, required: true },
		orderType: { type: String, enum: Object.values(OrderType), required: true },
		orderSide: { type: String, enum: Object.values(OrderSide), required: true },
		placementType: { type: String, enum: Object.values(OrderPlacementType), required: true },
		price: { type: Number, required: true },
		total: { type: Number, required: true },
		quoteCurrency: { type: String, required: true },
		quoteTotal: { type: Number, required: true },
		status: { type: String, enum: Object.values(OrderStatus), required: true },
		externalOrderId: { type: String, required: true },
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
	orderType: 1,
	orderSide: 1,
	placementType: 1,
	status: 1,
	createdAt: 1,
});

export const Order = mongoose.model<IOrder>("order", OrderSchema);
