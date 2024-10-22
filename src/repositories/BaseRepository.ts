import { Model, Document } from "mongoose";

class BaseRepository<T extends Document> {
	private readonly model: Model<T>;

	constructor(model: Model<T>) {
		if (!model) throw new Error("model must be provided");
		this.model = model;
	}

	// Get documents based on the provided options
	async get(options: Record<string, unknown>): Promise<T[]> {
		return this.model.find(options, "-password").exec();
	}

	// Add a new document using Promises instead of callbacks
	async add(data: Partial<T>): Promise<T> {
		return this.model.create(data); // No need for exec() with create()
	}

	// Get a document by ID
	async getById(id: string): Promise<T | null> {
		return this.model.findById(id, "-password").exec(); // Use exec() to return a promise
	}

	// Delete a document by ID
	async deleteById(id: string): Promise<T | null> {
		return this.model.findByIdAndDelete(id).exec();
	}

	// Update a document by ID
	// Update a document by ID using Promises
	async updateUser(id: string, data: Partial<T>): Promise<T | null> {
		return this.model.findByIdAndUpdate(id, data, { new: true }).exec(); // Use exec() to return a promise
	}
}

// Factory function to create a new instance of the repository with a specific model
export const createRepository = <T extends Document>(model: Model<T>): BaseRepository<T> => {
	return new BaseRepository<T>(model);
};
