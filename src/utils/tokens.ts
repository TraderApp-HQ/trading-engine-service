import JWT from "jsonwebtoken";
import { config } from "dotenv";
import { Request } from "express";

config();

export async function verifyAccessToken(accessToken: string) {
	const secret = process.env.ACCESS_TOKEN_SECRET ?? "";

	return new Promise((resolve, reject) => {
		JWT.verify(accessToken, secret, (err, payload) => {
			if (err) {
				err.name = "Unauthorized";
				err.message = "Invalid Token";
				reject(err);
			}

			// return payload
			resolve(payload);
		});
	});
}

// A function to get accessToken from headers and verify it
export async function checkUser(req: Request) {
	// get accessToken from req headers
	const accessToken = req.headers.authorization?.split(" ")[1];

	// check if access token was supplied
	if (!accessToken) {
		const error = new Error("Invalid Token");
		error.name = "Unauthorized";
		throw error;
	}

	// verify accessToken
	const payload = await verifyAccessToken(accessToken);

	return payload;
}
