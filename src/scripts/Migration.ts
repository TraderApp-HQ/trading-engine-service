import mongoose, { Document, Schema } from "mongoose";

export interface IMigration extends Document {
	script: string;
	executedAt: Date;
}

const MigrationSchema: Schema = new Schema({
	script: { type: String, required: true },
	executedAt: { type: Date, default: Date.now },
});

const Migration = mongoose.model<IMigration>("Migration", MigrationSchema);

export default Migration;
