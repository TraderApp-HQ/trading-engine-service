import swaggerJsdoc from "swagger-jsdoc";

import { ROUTES } from "../config/constants";
import { createGetOrders } from "../documentation/orders";
import {
	manualConnection,
	manualConnectionBody,
	deleteAccountParams,
	deleteAccount,
	getUserAccountWithBalancesParams,
	getUserAccountWithBalances,
	getUserAccountbyId,
	getUserAccountbyIdParams,
	updateAccount,
	updateAccountBody,
	updateAccountParams,
} from "../documentation/userTradingAccount";

const options: swaggerJsdoc.Options = {
	swaggerDefinition: {
		openapi: "3.0.0",
		info: {
			title: "Trading Engine Service API",
			version: "1.0.0",
			description: "API documentation for Trading Engine Service for TraderApp",
		},
		components: {
			securitySchemes: {
				bearerAuth: {
					type: "http",
					scheme: "bearer",
					bearerFormat: "JWT",
				},
			},
			schemas: {
				manualConnectionBody,
				deleteAccountParams,
				getUserAccountWithBalancesParams,
				getUserAccountbyIdParams,
				updateAccountParams,
				updateAccountBody,
			},
		},
		security: [
			{
				bearerAuth: [],
			},
		],
		paths: {
			[`/orders${ROUTES.getOrders}`]: { get: createGetOrders },
			[`/account${ROUTES.manualConnection}`]: { post: manualConnection },
			[`/account/delete/{id}`]: { patch: deleteAccount },
			[`/account/{userId}`]: { get: getUserAccountWithBalances },
			[`/account/trading/account/{tradingAccountId}`]: { get: getUserAccountbyId },
			[`/account/update/{tradingAccountId}`]: { patch: updateAccount },
		},
	},
	apis: ["./src/routes/*.ts"], // Point to your route files
};

const specs = swaggerJsdoc(options);

export default specs;
