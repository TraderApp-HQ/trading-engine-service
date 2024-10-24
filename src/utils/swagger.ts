import swaggerJsdoc from "swagger-jsdoc";

import { ROUTES } from "../config/constants";
import { createGetOrders } from "../documentation/orders";
import { addAccount, addAccountBody } from "../documentation/userTradingAccount";

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
				addAccountBody,
			},
		},
		security: [
			{
				bearerAuth: [],
			},
		],
		paths: {
			[`/orders${ROUTES.getOrders}`]: { get: createGetOrders },
			[`/account${ROUTES.addAccount}`]: { post: addAccount },
		},
	},
	apis: ["./src/routes/*.ts"], // Point to your route files
};

const specs = swaggerJsdoc(options);

export default specs;
