import {
	SQSClient,
	SendMessageCommand,
	ReceiveMessageCommand,
	DeleteMessageBatchCommand,
	Message,
} from "@aws-sdk/client-sqs";

interface QueueConstructorParams {
	region: string;
	queueUrl: string;
}

interface ReceiveMessageInput {
	maxNumberOfMessages?: number;
}

export class QueueService {
	private readonly sqsClient: SQSClient;
	private readonly queueUrl: string;

	constructor(input: QueueConstructorParams) {
		this.sqsClient = new SQSClient({ region: input.region });
		this.queueUrl = input.queueUrl;
	}

	async sendMessage(message: string): Promise<string> {
		const command = new SendMessageCommand({
			QueueUrl: this.queueUrl,
			MessageBody: message,
		});

		try {
			const response = await this.sqsClient.send(command);
			return response.MessageId ?? "";
		} catch (error) {
			console.error("Error sending message:", error);
			throw error;
		}
	}

	async receiveMessages(input?: ReceiveMessageInput): Promise<Message[]> {
		const command = new ReceiveMessageCommand({
			QueueUrl: this.queueUrl,
			MaxNumberOfMessages: input?.maxNumberOfMessages ?? 1,
		});

		try {
			const response = await this.sqsClient.send(command);
			if (response.Messages && response.Messages.length > 0) {
				return response.Messages;
			} else {
				return [];
			}
		} catch (error) {
			console.error("Error receiving messages:", error);
			throw error;
		}
	}

	async deleteMessages(messages: Message[]): Promise<void> {
		const entries = messages.map((message, index) => ({
			Id: message.MessageId,
			ReceiptHandle: message.ReceiptHandle,
		}));

		const command = new DeleteMessageBatchCommand({
			QueueUrl: this.queueUrl,
			Entries: entries,
		});

		try {
			await this.sqsClient.send(command);
			console.log("Messages deleted:", messages);
		} catch (error) {
			console.error("Error deleting messages:", error);
			throw error;
		}
	}
}
