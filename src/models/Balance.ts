import mongoose, { Schema, Document } from "mongoose";

export interface IBalance extends Document {
	userId: string; // Reference to the user
	exchange: string; // e.g., 'Binance'
	currency: string; // e.g., 'USDT', 'BTC'
	accountType: string; // e.g., 'SPOT', 'FUTURES'
	free: number; // Free balance
	locked: number; // Locked balance (e.g., in open orders)
	createdAt: Date;
	updatedAt: Date;
}

const BalanceSchema = new Schema<IBalance>({
	userId: { type: String, required: true },
	exchange: { type: String, required: true }, // e.g., 'Binance'
	currency: { type: String, required: true }, // e.g., 'USDT', 'BTC'
	accountType: { type: String, required: true }, // e.g., 'SPOT', 'FUTURES'
	free: { type: Number, required: true }, // Free balance
	locked: { type: Number, required: true }, // Locked balance
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now },
});

export const Balance = mongoose.model<IBalance>("Balance", BalanceSchema);
