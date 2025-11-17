import mongoose, { Schema, Document } from "mongoose";
import { TradingPlatformSlug } from "../config/enums";

export interface ITradingPlatformPair extends Document {
	platformId: number;
	assetId: number;
	currencyId: number;
	asset: string;
	currency: string;
	pair: string;
	platform: TradingPlatformSlug;
}

export interface ITradingPlatformPairModel extends ITradingPlatformPair {}

export const TradingPlatformPairSchema = new Schema<ITradingPlatformPairModel>(
	{
		platformId: { type: Number, ref: "trading-platform", required: true },
		assetId: { type: Number, ref: "asset", required: true },
		currencyId: { type: Number, ref: "Currency", required: true },
		asset: { type: String, required: true },
		currency: { type: String, required: true },
		pair: { type: String, required: true },
		platform: { type: String, enum: Object.values(TradingPlatformSlug), required: true },
	},
	{ versionKey: false, timestamps: false, id: false, _id: false }
);

TradingPlatformPairSchema.index({ platformId: 1, assetId: 1, currencyId: 1 }, { unique: true });

export default mongoose.model<ITradingPlatformPairModel>(
	"trading-platform-pair",
	TradingPlatformPairSchema
);
