import mongoose, { Schema, Document } from "mongoose";

// Define the interface for CoinsUnknown
export interface IUnknownCoin extends Document {
	_id: number;
	symbol: string;
	tradingPlatformId: number;
}

// Create the schema
export const UnknownCoinSchema = new Schema<IUnknownCoin>(
	{
		_id: Number,
		symbol: { type: String },
		tradingPlatformId: { type: Number, ref: "trading-platform" },
	},
	{ _id: false }
);

// mongodb+srv://assets-service-dev:9fLFmuaBuMn6hJJn@dev-cluster.uuz5vc1.mongodb.net/assets-service-db?retryWrites=true&w=majority

// Apply the auto-increment plugin to the schema
// eslint-disable-next-line @typescript-eslint/no-var-requires
const AutoIncrement = require("mongoose-sequence")(mongoose);
UnknownCoinSchema.plugin(AutoIncrement, { id: "order_seq", inc_field: "_id" });

// Create the model
const UnknownCoin = mongoose.model<IUnknownCoin>("UnknownCoin", UnknownCoinSchema);

export default UnknownCoin;
