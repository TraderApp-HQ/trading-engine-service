import crypto from "crypto";

// Encryption settings
const ENCRYPTION_KEY = process.env.API_SECRET_KEY_ENCRYPTION_KEY ?? ""; // Must be 32 characters for AES-256
const IV_LENGTH = 16; // AES block size

// Function to encrypt
export const encrypt = (text: string) => {
	const iv = crypto.randomBytes(IV_LENGTH); // Generate a random initialization vector
	const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
	let encrypted = cipher.update(text, "utf8", "hex");
	encrypted += cipher.final("hex");
	return iv.toString("hex") + ":" + encrypted; // Return iv and encrypted text
};

// Function to decrypt
export const decrypt = (encrypted: string) => {
	const textParts = encrypted.split(":");
	const iv = Buffer.from(textParts[0], "hex");
	const encryptedText = Buffer.from(textParts[1], "hex");
	const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
	let decrypted = decipher.update(encryptedText, undefined, "utf8");
	decrypted += decipher.final("utf8");
	return decrypted;
};
