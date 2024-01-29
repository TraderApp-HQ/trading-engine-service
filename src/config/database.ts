import { PrismaClient } from "@prisma/client";
import "dotenv/config";

let db: PrismaClient;

export async function prismaClient() {
	return db;
}

async function initDatabase() {
	db = new PrismaClient({
		datasources: {
			db: { url: process.env.DATABASE_URL },
		},
	});
}

export default initDatabase;
