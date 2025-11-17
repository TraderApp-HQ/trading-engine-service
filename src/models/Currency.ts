import mongoose, { Schema, Document } from "mongoose";

export interface ICurrency extends Document {
	_id: number;
	name: string;
	symbol: string;
	isTradingActive: boolean;
	logo: string;
	createdAt: Date;
	updatedAt: Date;
}

interface ICurrencyModel extends ICurrency {}

export const CurrencySchema = new Schema<ICurrencyModel>(
	{
		_id: { type: Number, required: true },
		name: { type: String, required: true },
		symbol: { type: String, required: true },
		isTradingActive: { type: Boolean, default: true },
		logo: { type: String, required: true },
		// coin: { type: mongoose.Types.ObjectId, ref: "Coin", required: true },
		// exchangePairs: [{ type: mongoose.Types.ObjectId, ref: "ExchangePair" }],
	},
	{ versionKey: false, timestamps: true }
);

CurrencySchema.set("toJSON", {
	virtuals: true,
	transform: (doc, ret) => {
		ret.id = ret._id; // Optionally include _id as id
		delete ret._id; // Remove _id from output
		return ret;
	},
});

export default mongoose.model<ICurrencyModel>("currency", CurrencySchema);
