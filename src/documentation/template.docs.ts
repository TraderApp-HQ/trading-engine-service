import { DOC_RESPONSE, RESPONSE_CODES, RESPONSE_TAGS } from "../config/constants";

const createTemplateBody = {
	type: "object",
	required: ["test"],
	properties: {
		test: {
			type: "string",
			example: "",
		},
	},
};

const createTemplate = {
	tags: [RESPONSE_TAGS.getOrders],
	description: "get orders",
	requestBody: {
		content: {
			"application/json": {
				schema: {
					$ref: "#/components/schemas/createTemplateBody",
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

export { createTemplate, createTemplateBody };
