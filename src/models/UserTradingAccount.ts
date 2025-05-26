import mongoose, { Schema, Document } from "mongoose";
import {
	AccountConnectionStatus,
	Category,
	ConnectionType,
	TradingPlatform,
} from "../config/enums";

export interface IUserTradingAccount extends Document {
	userId: string;
	platformName: TradingPlatform;
	platformId: number; // e.g., 112
	apiKey?: string;
	apiSecret?: string;
	passphrase?: string;
	accessToken?: string;
	refreshToken?: string;
	externalAccountUserId: string; // Unique userId identifier returned by trading plaforms like Binance
	isWithdrawalEnabled: boolean;
	isFuturesTradingEnabled: boolean;
	isSpotTradingEnabled: boolean;
	isIpAddressWhitelisted?: boolean;
	connectionStatus: AccountConnectionStatus;
	errorMessages: string[]; // List of reasons/messages for the unhealthy status
	category: Category;
	connectionType: ConnectionType;
}

const UserTradingAccountSchema = new Schema<IUserTradingAccount>(
	{
		userId: { type: String, required: true },
		platformName: {
			type: String,
			enum: TradingPlatform,
			required: true,
		},
		platformId: { type: Number, required: true },
		apiKey: { type: String },
		apiSecret: { type: String },
		passphrase: { type: String },
		externalAccountUserId: { type: String },
		isWithdrawalEnabled: { type: Boolean },
		isFuturesTradingEnabled: { type: Boolean },
		isSpotTradingEnabled: { type: Boolean },
		isIpAddressWhitelisted: { type: Boolean },
		connectionStatus: {
			type: String,
			enum: AccountConnectionStatus,
			default: AccountConnectionStatus.FAILED,
		},
		errorMessages: { type: [String], default: [] },
		category: {
			type: String,
			enum: Category,
		},
		connectionType: {
			type: String,
			enum: ConnectionType,
		},
	},
	{ versionKey: false, timestamps: true }
);

UserTradingAccountSchema.index({
	userId: 1,
	platformId: 1,
	platformName: 1,
	externalAccountUserId: 1,
	connectionStatus: 1,
	category: 1,
});

export default mongoose.model<IUserTradingAccount>(
	"user-trading-account",
	UserTradingAccountSchema
);
