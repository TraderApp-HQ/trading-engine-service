import { DOC_RESPONSE, RESPONSE_CODES, RESPONSE_TAGS } from "../../config/constants";

const deleteAccountParams = {
	type: "object",
	properties: {
		id: {
			type: "string",
			example: "60d21b4667d0d8992e610c85",
		},
	},
};

const deleteAccount = {
	tags: [RESPONSE_TAGS.deleteAccout],
	description: "Delete Account",
	parameters: [
		{
			in: "path",
			name: "id",
			description: "Delete account using Id",
			required: true,
			schema: {
				$ref: "#/components/schemas/deleteAccountParams/properties/id",
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

export { deleteAccountParams, deleteAccount };
