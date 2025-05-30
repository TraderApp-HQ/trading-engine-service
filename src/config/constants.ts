import { apiDocumentationResponseObject } from "@traderapp/shared-resources";

export const ENVIRONMENTS: Record<string, string> = Object.freeze({
	development: "dev",
	staging: "staging",
	production: "prod",
	hotfix: "hotfix",
});

export const ResponseType = {
	SUCCESS: "success",
	ERROR: "error",
};

export const ErrorMessage = {
	unauthorized: "Unauthorized",
	validationError: "ValidationError",
	forbidden: "Forbidden",
	notfound: "NotFound",
};

export const RESPONSE_TAGS = {
	getOrders: "getOrders",
	manualConnection: "manualConnection",
	deleteAccout: "deleteAccout",
	updateAccount: "updateAccount",
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
	UPDATE_ACCOUNT: "Account updated Successfully",
	DELETE_ACCOUNT: "Account deleted Successfully",
	ACCOUNT_NOT_FOUND: "Account not found",
	GET_USER_TRADING_ACCOUNT_WITH_BALANCES: "Account Retrieved Successfully",
};

export const ROUTES = {
	getOrders: "/",
	manualConnection: "/connect/manual",
};
