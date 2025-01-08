import mongoose, { Schema, Document } from "mongoose";
import { TradeSide, TradeStatus } from "../config/enums";

export interface ITrade extends Document {
	// tradeId: string;
	// batchId: Types.ObjectId; // Reference to the Batch
	userId: string; // Should reference the User model
	signalId: string;
	baseAsset: string;
	quoteCurrency: string;
	baseQuantity: number;
	avgBuyPrice: number;
	quoteTotal: number;
	pair: string;
	side: TradeSide;
	pnl: number;
	status: TradeStatus;
	createdAt: Date;
	updatedAt: Date;
}

const TradeSchema = new Schema<ITrade>({
	// tradeId: { type: String, unique: true, required: true },
	// batchId: { type: Schema.Types.ObjectId, ref: "trade-batch", required: true },
	userId: { type: String, required: true },
	signalId: { type: String, required: true },
	baseAsset: { type: String, required: true },
	baseQuantity: { type: Number, required: true },
	avgBuyPrice: { type: Number, required: true },
	quoteCurrency: { type: String, required: true },
	quoteTotal: { type: Number, required: true },
	pair: { type: String, required: true },
	side: { type: String, enum: Object.values(TradeSide), required: true },
	pnl: { type: Number, default: 0 },
	status: { type: String, enum: Object.values(TradeStatus), required: true },
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now },
});

TradeSchema.index({
	// tradeId: 1,
	// batchId: 1,
	userId: 1,
	signalId: 1,
	baseAsset: 1,
	quoteCurrency: 1,
	pair: 1,
	side: 1,
	status: 1,
	createdAt: 1,
	pnl: 1,
});

export const Trade = mongoose.model<ITrade>("trade", TradeSchema);
