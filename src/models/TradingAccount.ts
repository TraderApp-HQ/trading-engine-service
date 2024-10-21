import mongoose, { Schema, Document } from "mongoose";
import { AccountConnectionStatus } from "../config/enums";
import { encrypt } from "../utils/encryption";

export interface ITradingAccount extends Document {
	userId: string; // Reference to the user who owns these credentials
	exchange: string; // e.g., 'Binance'
	apiKey: string;
	apiSecret: string;
	accountUserId: string; // Unique identifier returned by Binance
	isWithdrawalEnabled: boolean;
	isFuturesTradingEnabled: boolean;
	isSpotTradingEnabled: boolean;
	isIpWhitelistingEnabled?: boolean;
	connectionStatus: AccountConnectionStatus;
	errorMessages: string[]; // List of reasons/messages for the unhealthy status
	createdAt: Date;
	updatedAt: Date;
}

const TradingAccountSchema = new Schema<ITradingAccount>(
	{
		userId: { type: String, required: true },
		exchange: { type: String, required: true },
		apiKey: { type: String, required: true },
		apiSecret: { type: String, required: true },
		accountUserId: { type: String, required: true },
		isSpotTradingEnabled: { type: Boolean, required: true },
		isFuturesTradingEnabled: { type: Boolean, required: true },
		isWithdrawalEnabled: { type: Boolean, required: true },
		isIpWhitelistingEnabled: { type: Boolean, default: false },
		connectionStatus: {
			type: String,
			enum: AccountConnectionStatus,
			default: AccountConnectionStatus.NOT_CONNECTED,
		},
		errorMessages: { type: [String], default: [] },
	},
	{ timestamps: true }
);

// Pre-save hook to encrypt the apiKey and apiSecret
TradingAccountSchema.pre("save", function (next) {
	const account = this as ITradingAccount;

	// Only encrypt if the fields are not already encrypted
	if (!account.isModified("apiKey") && !account.isModified("apiSecret")) {
		next();
		return;
	}

	account.apiKey = encrypt(account.apiKey);
	account.apiSecret = encrypt(account.apiSecret);

	next();
});

export default mongoose.model<ITradingAccount>("TradingAccount", TradingAccountSchema);
