import mongoose, { Schema, Document, Types } from "mongoose";
import { OrderType, OrderPlacementType, OrderStatus } from "../config/enums"; // Import the enums

export interface IOrder extends Document {
	// orderId: string;
	userId: string;
	tradeId: Types.ObjectId; // Should reference the Trade model
	baseAsset: string;
	baseQuantity: number;
	type: OrderType;
	placementType: OrderPlacementType;
	price: number;
	total: number;
	quoteCurrency: string;
	quoteTotal: number;
	status: OrderStatus;
	// createdAt: Date;
	// updatedAt: Date;asdfosifnonsvsrugreu9hgrwehgftutueruhfddjfjgfjjkv vxnobnpbdpbms
}

const OrderSchema = new Schema<IOrder>(
	{
		// orderId: { type: String, unique: true, required: true },
		userId: { type: String, required: true },
		tradeId: { type: Schema.Types.ObjectId, ref: "trade", required: true },
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
