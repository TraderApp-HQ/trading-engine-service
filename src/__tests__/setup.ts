import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongod: MongoMemoryServer;

// Set required environment variables for testing
process.env.NODE_ENV = "test";
process.env.API_SECRET_KEY_ENCRYPTION_KEY = "12345678901234567890123456789012";
process.env.SPLIT_IO_CLIENT_KEY = "localhost";

beforeAll(async () => {
	// Start in-memory MongoDB instance
	mongod = await MongoMemoryServer.create();
	const uri = mongod.getUri();

	// Connect to the in-memory database
	await mongoose.connect(uri);
});

afterAll(async () => {
	// Clean up and close connections
	await mongoose.connection.dropDatabase();
	await mongoose.connection.close();
	await mongod.stop();
});

afterEach(async () => {
	// Clear all collections after each test
	const collections = mongoose.connection.collections;
	for (const key in collections) {
		const collection = collections[key];
		await collection.deleteMany({});
	}
});
