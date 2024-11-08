import { DOC_RESPONSE, RESPONSE_CODES, RESPONSE_TAGS } from "../../config/constants";

const getUserAccountWithBalancesParams = {
	type: "object",
	properties: {
		id: {
			type: "string",
			example: "60d21b4667d0d8992e610c85",
		},
	},
};

const getUserAccountWithBalances = {
	tags: [RESPONSE_TAGS.deleteAccout],
	description: "Get user account with balances",
	parameters: [
		{
			in: "path",
			name: "id",
			description: "get account using Id",
			required: true,
			schema: {
				$ref: "#/components/schemas/getUserAccountWithBalancesParams/properties/id",
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

export { getUserAccountWithBalancesParams, getUserAccountWithBalances };
