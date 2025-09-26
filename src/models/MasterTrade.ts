import mongoose, { Schema, Document } from "mongoose";
import { TradeSide, TradeStatus } from "../config/enums";

export interface IMasterTrade extends Document {
	id: string;
	signalId?: string;
	baseAsset: string;
	quoteCurrency: string;
	baseQuantity: number;
	quoteTotal: number;
	entryPrice: number;
	stopLossPrice: number;
	takeProfitPrice?: number;
	ordersTriggerPrice: number;
	targetOrdersAmountToFill: number;
	chartUrl?: string;
	tradeNote?: string;
	pair: string;
	side: TradeSide;
	pnl: number;
	status: TradeStatus;
	createdAt: Date;
	updatedAt: Date;
}

const MasterTradeSchema = new Schema<IMasterTrade>(
	{
		signalId: { type: String },
		baseAsset: { type: String, required: true },
		baseQuantity: { type: Number, required: true },
		entryPrice: { type: Number, required: true },
		stopLossPrice: { type: Number, required: true },
		takeProfitPrice: { type: Number },
		ordersTriggerPrice: { type: Number, required: true },
		targetOrdersAmountToFill: { type: Number, required: true },
		chartUrl: { type: String },
		tradeNote: { type: String },
		quoteCurrency: { type: String, required: true },
		quoteTotal: { type: Number, required: true },
		pair: { type: String, required: true },
		side: { type: String, enum: Object.values(TradeSide), required: true },
		pnl: { type: Number, default: 0 },
		status: {
			type: String,
			enum: Object.values(TradeStatus),
			default: TradeStatus.PENDING,
		},
	},
	{ versionKey: false, timestamps: true }
);

// Override the toJSON method to map _id to id
MasterTradeSchema.set("toJSON", {
	transform: (doc, ret) => {
		ret.id = ret._id;
		delete ret._id;
		delete ret.__v;
		return ret;
	},
});

MasterTradeSchema.index({
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

export const MasterTrade = mongoose.model<IMasterTrade>("master-trade", MasterTradeSchema);
