import mongoose, { Schema, Document } from "mongoose";
import { Category } from "../config/enums";

export interface IAsset extends Document {
	_id: number;
	name: string;
	slug: string;
	symbol: string;
	logo: string;
	description: string;
	urls: string;
	rank: number;
	isCoinActive: boolean;
	isTradingActive: boolean;
	dateLaunched: Date;
	category: Category;
	// currency: mongoose.Types.ObjectId
	// exchangePairs: mongoose.Types.ObjectId[];
}

interface IAssetModel extends IAsset {}

export const AssetSchema = new Schema<IAssetModel>(
	{
		_id: { type: Number, required: true },
		name: { type: String, required: true },
		slug: { type: String, required: true },
		symbol: { type: String, required: true },
		logo: { type: String, required: true },
		description: { type: String, required: true },
		urls: { type: String, required: true },
		rank: { type: Number, required: true },
		isCoinActive: { type: Boolean, required: true },
		isTradingActive: { type: Boolean, default: true },
		dateLaunched: { type: Date, default: Date.now },
		category: { type: String, required: true, enum: Object.values(Category) },
		// currency: { type: mongoose.Types.ObjectId, ref: "Currency" },
		// exchangePairs: [{ type: mongoose.Types.ObjectId, ref: "ExchangePair" }],
	},
	{
		versionKey: false,
		timestamps: false,
	}
);

export default mongoose.model<IAssetModel>("asset", AssetSchema);
