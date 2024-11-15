import { DOC_RESPONSE, RESPONSE_CODES, RESPONSE_TAGS } from "../../config/constants";

const getUserAccountbyIdParams = {
	type: "object",
	properties: {
		tradingAccountId: {
			type: "string",
			example: "60d21b4667d0d8992e610c85",
		},
	},
};

const getUserAccountbyId = {
	tags: [RESPONSE_TAGS.deleteAccout],
	description: "Get user account with balances",
	parameters: [
		{
			in: "path",
			name: "tradingAccountId",
			description: "get account using trading Account Id",
			required: true,
			schema: {
				$ref: "#/components/schemas/getUserAccountbyIdParams/properties/tradingAccountId",
			},
		},
	],
	responses: {
		[RESPONSE_CODES.ok]: DOC_RESPONSE.SUCCESS,
		[RESPONSE_CODES.badRequest]: DOC_RESPONSE.BADREQUEST,
		[RESPONSE_CODES.unauthorized]: DOC_RESPONSE.UNAUTHORIZED,
		[RESPONSE_CODES.serverError]: DOC_RESPONSE.SERVERERROR,
	},
};

export { getUserAccountbyIdParams, getUserAccountbyId };
