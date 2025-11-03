import mongoose, { Schema, Document } from "mongoose";
import { Category, ConnectionType, TradingPlatformStatus } from "../config/enums";

export interface ITradingPlatform extends Document {
	_id: number;
	name: string;
	slug: string;
	logo: string;
	description?: string;
	status: TradingPlatformStatus;
	urls: string;
	makerFee: number;
	takerFee: number;
	dateLaunched: Date;
	category: Category[];
	connectionTypes: ConnectionType[];
	isIpAddressWhitelistRequired: boolean;
	isSpotTradingSupported: boolean;
	isFuturesTradingSupported: boolean;
	isMarginTradingSupported: boolean;
	isPassphraseRequired?: boolean;
}

interface ITradingPlatformModel extends ITradingPlatform {}

export const TradingPlatformSchema = new Schema<ITradingPlatformModel>(
	{
		_id: { type: Number, required: true },
		name: { type: String, required: true },
		slug: { type: String, required: true },
		logo: { type: String, required: true },
		description: { type: String },
		status: { type: String, enum: Object.values(TradingPlatformStatus), required: true },
		urls: { type: String, required: true },
		makerFee: { type: Number, required: true },
		takerFee: { type: Number, required: true },
		dateLaunched: { type: Date, default: Date.now },
		category: [{ type: String, enum: Category, required: true }],
		connectionTypes: [{ type: String, enum: Object.values(ConnectionType) }],
		isIpAddressWhitelistRequired: { type: Boolean, required: true },
		isSpotTradingSupported: { type: Boolean, required: true },
		isFuturesTradingSupported: { type: Boolean, required: true },
		isMarginTradingSupported: { type: Boolean, required: true },
		isPassphraseRequired: { type: Boolean },
	},
	{
		versionKey: false,
		timestamps: false,
	}
);

export default mongoose.model<ITradingPlatformModel>("trading-platform", TradingPlatformSchema);
