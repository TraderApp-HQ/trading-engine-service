import { SplitFactory } from "@splitsoftware/splitio";
import { FEATURE_FLAG_CONFIG, FeatureFlag, TrafficType } from "./feature-flags";

export class FeatureFlagManager {
	private readonly factory: SplitIO.ISDK;
	private readonly client: SplitIO.IClient;

	constructor() {
		if (!process.env.SPLIT_IO_CLIENT_KEY) {
			throw new Error("Feature flag configuration key is missing/not set.");
		}

		this.factory = SplitFactory({
			core: {
				authorizationKey: process.env.SPLIT_IO_CLIENT_KEY,
			},
			startup: {
				readyTimeout: 30,
			},
		});

		this.client = this.factory.client();
	}

	public destroy() {
		this.client.destroy();
	}

	public async checkToggleFlag(
		flagName: FeatureFlag,
		userId: string,
		role?: string[]
	): Promise<boolean> {
		const featureFlagConfig = FEATURE_FLAG_CONFIG[flagName];
		if (!featureFlagConfig) {
			throw new Error(
				`Feature configuration not found for ${flagName}. Results could be incorrect...`
			);
		}

		let treatment: SplitIO.Treatment;
		if (featureFlagConfig.level === TrafficType.USER) {
			await this.client.ready().catch((e) => {
				console.error(e);
			});
			treatment = this.client.getTreatment(userId, flagName);
		}
		// else if (featureFlagConfig.level === TrafficType.ORG) {
		// 	// treatment = this.client.getTreatment(tenantId || "key", flagName);
		// 	treatment = this.client.getTreatment("key", flagName);
		// }
		else {
			throw new Error("Feature configuration incorrect.");
		}
		return treatment === "on";
	}
}
