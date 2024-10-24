import { apiDocumentationResponseObject } from "@traderapp/shared-resources";

export const ENVIRONMENTS: Record<string, string> = Object.freeze({
	development: "dev",
	staging: "staging",
	production: "prod",
});

export const ResponseType = {
	SUCCESS: "success",
	ERROR: "error",
};

export const RESPONSE_TAGS = {
	getOrders: "getOrders",
	addAccount: "addAccount",
	deleteAccout: "deleteAccout",
};

export const RESPONSE_CODES = {
	ok: "200",
	badRequest: "400",
	unauthorized: "401",
	serverError: "500",
};

export const DOC_RESPONSE = {
	SERVERERROR: apiDocumentationResponseObject("Internal Server Error"),
	UNAUTHORIZED: apiDocumentationResponseObject("Error: Unauthorized"),
	BADREQUEST: apiDocumentationResponseObject("Error: Bad Request"),
	SUCCESS: apiDocumentationResponseObject("Success"),
};

export const ResponseMessage = {
	CREATE_ACCOUNT: "Account created Successfully",
	DELETE_ACCOUNT: "Account deleted Successfully",
	ACCOUNT_NOT_FOUND: "Account not found",
};

export const ROUTES = {
	getOrders: "/",
	addAccount: "/add",
};
