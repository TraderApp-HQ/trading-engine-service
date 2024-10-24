import { DOC_RESPONSE, RESPONSE_CODES, RESPONSE_TAGS } from "../../config/constants";

const addAccountBody = {
	type: "object",
	properties: {
		userId: {
			type: "string",
			example: "1234",
		},
		exchangeName: {
			type: "string",
			example: "BINANCE",
		},
		exchangeId: {
			type: "number",
			example: 131,
		},
		apiKey: {
			type: "string",
			example: "oMIjzBiHdhdWuMzGXRZ241JAEx9JUF2ZjxrSyD7ZZW4",
		},
		apiSecret: {
			type: "string",
			example: "H0QxUofzifmrGPTkcs7Y_4wz5xv9G_3prk583FpbiLmcmqFfGABSxPVQzygDGIg",
		},
	},
};

const addAccount = {
	tags: [RESPONSE_TAGS.addAccount],
	description: "Add new Account",
	requestBody: {
		content: {
			"application/json": {
				schema: {
					$ref: "#/components/schemas/addAccountBody",
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

export { addAccountBody, addAccount };
