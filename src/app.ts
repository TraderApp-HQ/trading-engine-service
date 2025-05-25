import express, { Application, Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import cors from "cors";
import { config } from "dotenv";
import swaggerUi from "swagger-ui-express";
import { logger, initSecrets, apiResponseHandler } from "@traderapp/shared-resources";
import { ENVIRONMENTS, ErrorMessage, ResponseType } from "./config/constants";
import secretsJson from "./env.json";
import specs from "./utils/swagger";
// import Redis from "ioredis";

// import routes
import { OrderRoutes, UserTradingAccountRoutes } from "./routes";

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
	// const port = 8081;
	const dbUrl = process.env.TRADING_ENGINE_SERVICE_DB_URL ?? "";
	// const dbUrl = "mongodb://localhost:27017/trading-service-db";
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
	// Define an array of allowed origins
	const allowedOrigins = [
		"http://localhost:3000",
		"http://localhost:8788",
		"http://localhost:8080",
		"https://users-dashboard-dev.traderapp.finance",
		"https://web-dashboard-dev.traderapp.finance",
		"https://www.web-dashboard-dev.traderapp.finance",
		"https://web-dashboard-staging.traderapp.finance",
		"https://www.web-dashboard-staging.traderapp.finance",
		"https://web-dashboard-hotfix.traderapp.finance",
		"https://www.web-dashboard-hotfix.traderapp.finance",
		"https://dashboard.traderapp.finance",
		"https://www.dashboard.traderapp.finance",
	];

	const corsOptions = {
		origin: (
			origin: string | undefined,
			callback: (error: Error | null, allow?: boolean) => void
		) => {
			// Allow requests with no origin (like mobile apps or curl requests)
			if (!origin) {
				callback(null, true);
				return;
			}
			if (allowedOrigins.includes(origin)) {
				callback(null, true);
			} else {
				callback(new Error(`Not allowed by CORS: ${origin}`));
			}
		},
		methods: "GET, HEAD, PUT, PATCH, POST, DELETE",
		credentials: true, // Allow credentials
	};
	// cors
	app.use(cors(corsOptions));

	// parse incoming requests
	app.use(express.urlencoded({ extended: true }));
	app.use(express.json());

	// documentation
	app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

	// api routes
	app.use(`/orders`, OrderRoutes);
	app.use(`/account`, UserTradingAccountRoutes);

	// health check
	app.get("/ping", (_req, res) => {
		res.status(200).send({ message: `pong!!! Trading engine service ${env} server running!` });
	});

	// handle errors
	app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
		let errorName = err.name;
		let errorMessage = err.message;
		let statusCode;

		if (err.name === ErrorMessage.validationError) statusCode = 400;
		else if (err.name === ErrorMessage.unauthorized) statusCode = 401;
		else if (err.name === ErrorMessage.forbidden) statusCode = 403;
		else if (err.name === ErrorMessage.notfound) statusCode = 404;
		else {
			statusCode = 500;
			errorName = "InternalServerError";
			errorMessage = "Something went wrong. Please try again after a while.";
			console.log("Error name: ", errorName, "Error message: ", err.message, "errorObj", err);
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

	// const redis = new Redis({
	// 	host: process.env.REDIS_URL,
	// 	port: Number(process.env.REDIS_PORT),
	// });

	// // Example usage
	// async function run() {
	// 	try {
	// 		await redis.set("key", "value of something I put in redis cluster");
	// 		const result = await redis.get("key");
	// 		console.log(result); // Outputs: value
	// 	} catch (error) {
	// 		console.error("Redis error:", error);
	// 	} finally {
	// 		redis.disconnect();
	// 	}
	// }

	// run();
}

export { app };
