import mongoose, { Schema, Document } from "mongoose";
import {
	OrderPlacementType,
	TradingPlatform,
	TradeStatus,
	AccountType,
	TradeSide,
	TradeRisk,
	Category,
	CandleStick,
} from "../config/enums";

export interface IMasterTrade extends Document {
	id: string;
	signalId?: string;
	baseAsset: string;
	baseAssetLogoUrl: string;
	quoteCurrency: string;
	baseQuantity: number;
	quoteTotal: number;
	currentPrice: number;
	entryPrice: number;
	stopLossPrice: number;
	takeProfitPrice?: number;
	ordersTriggerPrice: number;
	targetOrdersAmountToFill: number;
	orderPlacementType?: OrderPlacementType;
	accountType?: AccountType;
	supportedTradingPlatforms: TradingPlatform[];
	chartUrl?: string;
	tradeNote?: string;
	pair: string;
	side: TradeSide;
	pnl: number;
	pnlPercentage: number;
	estimatedProfit: number;
	estimatedLoss: number;
	status: TradeStatus;
	createdAt: Date;
	updatedAt: Date;
	candlestick: CandleStick;
	risk: TradeRisk;
	category: Category;
	defaultTradingPlatform: TradingPlatform;
}

export interface ICreateMasterTrade
	extends Omit<
		IMasterTrade,
		| "id"
		| "createdAt"
		| "updatedAt"
		| "pnl"
		| "pnlPercentage"
		| "defaultTradingPlatform"
		| keyof Document
	> {}

const MasterTradeSchema = new Schema<IMasterTrade>(
	{
		signalId: { type: String },
		baseAsset: { type: String, required: true },
		baseAssetLogoUrl: { type: String, required: true },
		baseQuantity: { type: Number, default: 0 },
		currentPrice: { type: Number, default: 0 },
		entryPrice: { type: Number, required: true },
		stopLossPrice: { type: Number, required: true },
		takeProfitPrice: { type: Number },
		ordersTriggerPrice: { type: Number, default: 0 },
		targetOrdersAmountToFill: { type: Number, required: true },
		chartUrl: { type: String },
		tradeNote: { type: String },
		quoteCurrency: { type: String, required: true },
		quoteTotal: { type: Number, default: 0 },
		pair: { type: String, required: true },
		side: { type: String, enum: Object.values(TradeSide), required: true },
		pnl: { type: Number, default: 0 },
		pnlPercentage: { type: Number, default: 0 },
		estimatedProfit: { type: Number, default: 0 },
		estimatedLoss: { type: Number, default: 0 },
		status: {
			type: String,
			enum: Object.values(TradeStatus),
			default: TradeStatus.PENDING,
		},
		orderPlacementType: {
			type: String,
			enum: Object.values(OrderPlacementType),
			default: OrderPlacementType.LIMIT,
		},
		accountType: {
			type: String,
			enum: Object.values(AccountType),
			default: AccountType.FUTURES,
		},
		supportedTradingPlatforms: {
			type: [String],
			enum: Object.values(TradingPlatform),
			required: true,
		},
		candlestick: { type: String, enum: Object.values(CandleStick), required: true },
		risk: { type: String, enum: Object.values(TradeRisk), required: true },
		category: { type: String, enum: Object.values(Category), required: true },
		defaultTradingPlatform: {
			type: String,
			enum: Object.values(TradingPlatform),
			required: true,
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
