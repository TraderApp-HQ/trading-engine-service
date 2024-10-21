import express, { Application, Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import cors from "cors";
import { config } from "dotenv";
import swaggerUi from "swagger-ui-express";
import { logger, initSecrets, apiResponseHandler } from "@traderapp/shared-resources";
import { ENVIRONMENTS, ResponseType } from "./config/constants";
import secretsJson from "./env.json";
import specs from "./utils/swagger";

// import routes
import { OrderRoutes } from "./routes";

config();

const app: Application = express();

const env = process.env.NODE_ENV || "development";
const suffix = ENVIRONMENTS[env] || "dev";
const secretNames = ["common-secrets", "trading-engine-service-secrets"];

(async function () {
	await initSecrets({
		env: suffix,
		secretNames,
		secretsJson,
	});
	const port = process.env.PORT;
	const dbUrl = process.env.TRADING_ENGINE_SERVICE_DB_URL ?? "";
	mongoose
		.connect(dbUrl)
		.then(() => {
			app.listen(port, async () => {
				startServer();
				logger.log(`Server listening at port ${port}`);
				logger.log(`Docs available at http://localhost:${port}/api-docs`);
			});
		})
		.catch((err) => {
			logger.log(`Error getting secrets. === ${JSON.stringify(err)}`);
			throw err;
		});
})();

function startServer() {
	// cors
	app.use(
		cors({
			origin: "http://localhost:3000",
			methods: "GET, HEAD, PUT, PATCH, POST, DELETE",
		})
	);

	// parse incoming requests
	app.use(express.urlencoded({ extended: true }));
	app.use(express.json());

	// documentation
	app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

	// api routes
	app.use(`/orders`, OrderRoutes);

	// health check
	app.get("/ping", (_req, res) => {
		res.status(200).send({ message: "pong" });
	});

	// handle errors
	app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
		let errorName = err.name;
		let errorMessage = err.message;
		let statusCode;

		if (err.name === "ValidationError") statusCode = 400;
		else if (err.name === "Unauthorized") statusCode = 401;
		else if (err.name === "Forbidden") statusCode = 403;
		else if (err.name === "NotFound") statusCode = 404;
		else {
			statusCode = 500;
			errorName = "InternalServerError";
			errorMessage = "Something went wrong. Please try again after a while.";
			console.log("Error name: ", errorName, "Error message: ", err.message);
		}

		res.status(statusCode).json(
			apiResponseHandler({
				type: ResponseType.ERROR,
				message: errorMessage,
				object: {
					statusCode,
					errorName,
					errorMessage,
				},
			})
		);
	});
}

export { app };
