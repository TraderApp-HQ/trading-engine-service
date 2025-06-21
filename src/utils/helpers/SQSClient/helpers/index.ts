import "dotenv/config";
import { QueueService } from "..";
import { logger } from "@traderapp/shared-resources";
import { IUpdateUserOnboardingStatusInput } from "../../types";

interface QueueInput {
	queueUrl: string;
	message: string | object | IUpdateUserOnboardingStatusInput;
	awsRegion?: string;
}

export const publishMessageToQueue = async ({ message, queueUrl, awsRegion }: QueueInput) => {
	const region = awsRegion ?? process.env.AWS_REGION ?? "";
	const sqsClient = new QueueService({ region, queueUrl });

	try {
		let processedBody: string;
		if (typeof message === "string") {
			processedBody = message;
		} else {
			processedBody = JSON.stringify(message);
		}
		await sqsClient.sendMessage(processedBody);
	} catch (error) {
		logger.error(`Error sending message to queue == ${JSON.stringify(error)}`);
	}
};
