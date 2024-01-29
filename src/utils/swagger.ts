import swaggerJsdoc from "swagger-jsdoc";

import { ROUTES } from "../config/constants";
import { createGetOrders } from "../documentation/orders";

const options: swaggerJsdoc.Options = {
	swaggerDefinition: {
		openapi: "3.0.0",
		info: {
			title: "Trading Engine Service API",
			version: "1.0.0",
			description: "API documentation for Trading Engine Service for TraderApp",
		},
		components: {
			securitySchemas: {
				bearerAuth: {
					type: "http",
					scheme: "bearer",
					bearerFormat: "JWT",
				},
			},
			schemas: {},
		},
		security: [
			{
				bearerAuth: [],
			},
		],
		paths: {
			[`/orders${ROUTES.getOrders}`]: { get: createGetOrders },
		},
	},
	apis: ["./src/routes/*.ts"], // Point to your route files
};

const specs = swaggerJsdoc(options);

export default specs;
