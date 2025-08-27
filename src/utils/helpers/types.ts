export enum UserOnboardingChecklist {
	IS_EMAIL_VERIFIED = "isEmailVerified",
	IS_FIRST_DEPOSIT_MADE = "isFirstDepositMade",
	IS_TRADING_ACCOUNT_CONNECTED = "isTradingAccountConnected",
	IS_SOCIAL_ACCOUNT_CONNECTED = "isSocialAccountConnected",
	IS_ONBOARDING_TASK_DONE = "isOnboardingTaskDone",
	SHOW_ONBOARDING_STEPS = "showOnboardingSteps",
	IS_PHONE_VERIFIED = "isPhoneVerified",
	IS_ID_VERIFIED = "isIdVerified",
	IS_PERSONAL_ATC_FUNDED = "isPersonalATCFunded",
}

export interface ITrackUserOnboardingChecklistInput {
	userId: string;
	onboardingChecklistItem: UserOnboardingChecklist;
	value?: boolean;
}
