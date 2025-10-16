import "dotenv/config";
import { QueueService } from "..";

interface QueueInput {
	queueUrl: string;
	message: string;
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
		console.log("Message sent to queue", { processedBody, queueUrl, awsRegion });
	} catch (error) {
		console.log("Error sending message to queue", { error, message, queueUrl, awsRegion });
	}
};
