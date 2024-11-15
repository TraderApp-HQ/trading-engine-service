import { DOC_RESPONSE, RESPONSE_CODES, RESPONSE_TAGS } from "../../config/constants";
import { Category, ConnectionType } from "../../config/enums";

const updateAccountParams = {
	type: "object",
	properties: {
		tradingAccountId: {
			type: "string",
			example: "60d21b4667d0d8992e610c85",
		},
	},
};

const updateAccountBody = {
	type: "object",
	properties: {
		userId: {
			type: "string",
			example: "1234",
		},
		platformName: {
			type: "string",
			example: "BINANCE",
		},
		platformId: {
			type: "number",
			example: 131,
		},
		platformLogo: {
			type: "string",
			example: "binance-logo.jpg",
		},
		apiKey: {
			type: "string",
			example: "oMIjzBiHdhdWuMzGXRZ241JAEx9JUF2ZjxrSyD7ZZW4",
		},
		apiSecret: {
			type: "string",
			example: "H0QxUofzifmrGPTkcs7Y_4wz5xv9G_3prk583FpbiLmcmqFfGABSxPVQzygDGIg",
		},
		category: {
			type: "string",
			enum: Category,
			default: Category.CRYPTO,
		},
		connectionType: {
			type: "string",
			enum: ConnectionType,
			default: ConnectionType.MANUAL,
		},
	},
};

const updateAccount = {
	tags: [RESPONSE_TAGS.updateAccount],
	description: "Update Account",
	parameters: [
		{
			in: "path",
			name: "tradingAccountId",
			description: "Update account using trading account Id",
			required: true,
			schema: {
				$ref: "#/components/schemas/updateAccountParams/properties/tradingAccountId",
			},
		},
	],
	requestBody: {
		content: {
			"application/json": {
				schema: {
					$ref: "#/components/schemas/updateAccountBody",
				},
			},
		},
		required: true,
	},
	responses: {
		[RESPONSE_CODES.ok]: DOC_RESPONSE.SUCCESS,
		[RESPONSE_CODES.badRequest]: DOC_RESPONSE.BADREQUEST,
		[RESPONSE_CODES.unauthorized]: DOC_RESPONSE.UNAUTHORIZED,
		[RESPONSE_CODES.serverError]: DOC_RESPONSE.SERVERERROR,
	},
};

export { updateAccountParams, updateAccountBody, updateAccount };
