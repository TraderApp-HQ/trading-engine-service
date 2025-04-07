import { DOC_RESPONSE, RESPONSE_CODES, RESPONSE_TAGS } from "../../config/constants";
import { Category, ConnectionType } from "../../config/enums";

const manualConnectionBody = {
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
			enum: Category.CRYPTO,
			default: Category.CRYPTO,
		},
		connectionType: {
			type: "string",
			enum: ConnectionType.MANUAL,
			default: ConnectionType.MANUAL,
		},
	},
};

const manualConnection = {
	tags: [RESPONSE_TAGS.manualConnection],
	description: "Manually connection new account",
	requestBody: {
		content: {
			"application/json": {
				schema: {
					$ref: "#/components/schemas/manualConnectionBody",
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

export { manualConnectionBody, manualConnection };
