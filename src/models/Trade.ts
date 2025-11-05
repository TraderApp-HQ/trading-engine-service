import mongoose, { Schema, Document } from "mongoose";
import { TradeSide, TradeStatus, TradingPlatform } from "../config/enums";

export interface ITrade extends Document {
	id: string;
	userId: string;
	masterTradeId: string;
	baseAsset: string;
	quoteCurrency: string;
	baseQuantity: number;
	quoteTotal: number;
	entryPrice: number;
	stopLossPrice: number;
	takeProfitPrice: number;
	pair: string;
	side: TradeSide;
	pnl: number;
	pnlPercentage: number;
	estimatedProfit: number;
	estimatedLoss: number;
	status: TradeStatus;
	platformName?: TradingPlatform;
	createdAt: Date;
	updatedAt: Date;
}

export interface IUserTrade extends ITrade {
	baseAssetLogoUrl: string;
	currentPrice: number;
}

const TradeSchema = new Schema<ITrade>(
	{
		userId: { type: String, required: true },
		masterTradeId: { type: String, required: true, ref: "master-trade" },
		baseAsset: { type: String, required: true },
		baseQuantity: { type: Number, required: true },
		entryPrice: { type: Number, required: true },
		stopLossPrice: { type: Number, required: true },
		takeProfitPrice: { type: Number },
		quoteCurrency: { type: String, required: true },
		quoteTotal: { type: Number, required: true },
		pair: { type: String, required: true },
		side: { type: String, enum: Object.values(TradeSide), required: true },
		pnl: { type: Number, default: 0 },
		pnlPercentage: { type: Number, default: 0 },
		estimatedProfit: { type: Number, default: 0 },
		estimatedLoss: { type: Number, default: 0 },
		status: { type: String, enum: Object.values(TradeStatus), required: true },
		platformName: { type: String, enum: Object.values(TradingPlatform) },
	},
	{ versionKey: false, timestamps: true }
);

// Override the toJSON method to map _id to id
TradeSchema.set("toJSON", {
	transform: (doc, ret) => {
		ret.id = ret._id;
		delete ret._id;
		delete ret.__v;
		return ret;
	},
});

TradeSchema.index({
	userId: 1,
	signalId: 1,
	baseAsset: 1,
	quoteCurrency: 1,
	pair: 1,
	side: 1,
	status: 1,
	createdAt: 1,
	pnl: 1,
	masterTradeId: 1,
});

export const Trade = mongoose.model<ITrade>("trade", TradeSchema);
