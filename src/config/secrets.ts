import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

export enum SecretLocation {
	commonSecrets = "common-secrets",
	tradingEngineServiceSecrets = "trading-engine-service-secrets",
	usersServiceSecrets = "users-service-secrets",
}

export interface ITradingEngineServiceSecrets {
	TRADING_ENGINE_SERVICE_DB_URL: string;
}

export interface IUsersServiceSecrets {
	USERS_SERVICE_DB_URL: string;
}

const client = new SecretsManagerClient({
	region: process.env.AWS_REGION || "eu-west-1",
});

export const getSecrets = async <T>(secretName: string): Promise<T> => {
	console.log(`getting ${secretName} secrets`);
	const command = new GetSecretValueCommand({ SecretId: secretName });
	const response = await client.send(command);

	return JSON.parse(response.SecretString || "{}") as T;
};
