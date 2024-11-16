import mongoose, { Schema, Document } from "mongoose";
import { AccountConnectionStatus, Category, ConnectionType, Platform } from "../config/enums";
// import { encrypt } from "../utils/encryption";

export interface IUserTradingAccount extends Document {
	userId: string; // Reference to the user who owns these credentials
	platformName: Platform;
	platformId: number; // e.g., 112
	platformLogo: string;
	apiKey: string;
	apiSecret: string;
	externalAccountUserId: string; // Unique identifier returned by trading plaforms like Binance
	isWithdrawalEnabled: boolean;
	isFuturesTradingEnabled: boolean;
	isSpotTradingEnabled: boolean;
	isIpWhitelistingEnabled?: boolean;
	connectionStatus: AccountConnectionStatus;
	errorMessages: string[]; // List of reasons/messages for the unhealthy status
	category: Category;
	connectionType: ConnectionType;
	balances: mongoose.Types.ObjectId[];
}

const UserTradingAccountSchema = new Schema<IUserTradingAccount>(
	{
		userId: { type: String, required: true },
		platformName: {
			type: String,
			enum: Platform,
			required: true,
		},
		platformId: { type: Number, required: true },
		platformLogo: { type: String, required: true },
		apiKey: { type: String },
		apiSecret: { type: String },
		externalAccountUserId: { type: String },
		isWithdrawalEnabled: { type: Boolean },
		isFuturesTradingEnabled: { type: Boolean },
		isSpotTradingEnabled: { type: Boolean },
		isIpWhitelistingEnabled: { type: Boolean },
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
		balances: [{ type: mongoose.Schema.Types.ObjectId, ref: "user-trading-account-balance" }],
	},
	{ versionKey: false, timestamps: true }
);

UserTradingAccountSchema.index({ userId: 1, exchangeId: 1, accountUserId: 1, connectionStatus: 1 });

// Pre-save hook to encrypt the apiKey and apiSecret
UserTradingAccountSchema.pre("save", function (next) {
	const account = this as IUserTradingAccount;

	// Only encrypt if the fields are not already encrypted
	if (!account.isModified("apiKey") && !account.isModified("apiSecret")) {
		next();
		return;
	}

	// account.apiKey = encrypt(account.apiKey);
	// account.apiSecret = encrypt(account.apiSecret);

	next();
});

export default mongoose.model<IUserTradingAccount>(
	"user-trading-account",
	UserTradingAccountSchema
);
