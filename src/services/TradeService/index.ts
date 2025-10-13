import { TradeStatus } from "../../config/enums";
import { ICreateMasterTrade, IMasterTrade, MasterTrade } from "../../models/MasterTrade";

export class TradeService {
	public async getActiveTrades(): Promise<IMasterTrade[]> {
		const activeTrades = await MasterTrade.find({ status: { $ne: TradeStatus.CLOSED } }).sort(
			"-updatedAt"
		);

		return activeTrades;
	}

	public async createTrade(newTrade: ICreateMasterTrade): Promise<IMasterTrade | null> {
		try {
			const createdTrade = await MasterTrade.create(newTrade);
			return createdTrade;
		} catch (error: unknown) {
			if (error instanceof Error) {
				throw new Error(error.message);
			}
			throw new Error("An unknown error occurred while creating trade.");
		}
	}
}
