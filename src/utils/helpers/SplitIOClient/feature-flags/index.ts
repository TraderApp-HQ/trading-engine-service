export type FeatureFlagConfig = {
	[flagName in FeatureFlag]: {
		level: TrafficType;
	};
};

export enum TrafficType {
	USER = "user", // User ID level flag
	ROLE = "role", // USER Role level flag
}

/** Add/revise feature flags here, and then fill out the configuration below. */
export type FeatureFlag = "release-send-otp" | "release-referral-tracking";

export const FEATURE_FLAG_CONFIG: FeatureFlagConfig = {
	"release-send-otp": {
		level: TrafficType.USER,
	},
	"release-referral-tracking": {
		level: TrafficType.USER,
	},
};
