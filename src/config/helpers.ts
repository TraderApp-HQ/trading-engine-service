import { ErrorName } from "./enums";

export const ApplicationError = ({ name, message }: { name: ErrorName; message: string }) => {
	const error = new Error(message);
	error.name = name;
	return error;
};
