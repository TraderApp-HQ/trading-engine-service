import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import "dotenv/config";

const s3Client = new S3Client({
	region: process.env.AWS_REGION ?? "eu-west-1",
});

// A function to upload a file to S3 and return the public URL of the file
export async function uploadFile(file: Buffer, id: string) {
	const bucketName = process.env.AWS_S3_BUCKET_NAME;

	if (!bucketName) {
		throw new Error("AWS_S3_BUCKET_NAME environment variable is not defined.");
	}

	const token = uuidv4();
	const params = {
		Bucket: bucketName,
		Key: `charts/${id}.png`,
		Body: file,
		ContentType: "image/png",
		Metadata: {
			token,
		},
	};

	try {
		// Perform upload
		await s3Client.send(new PutObjectCommand(params));

		// Construct the public URL of the file
		const url = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/charts/${id}.png`;

		return url;
	} catch (err: any) {
		console.error("Error uploading file to S3", err);
		return false;
	}
}

// A function to delete a file from S3
export async function deleteFile(id: string) {
	const bucketName = process.env.AWS_S3_BUCKET_NAME;

	if (!bucketName) {
		throw new Error("AWS_S3_BUCKET_NAME environment variable is not defined.");
	}

	const params = {
		Bucket: bucketName,
		Key: `charts/${id}.png`,
	};

	try {
		await s3Client.send(new DeleteObjectCommand(params));
	} catch (err: any) {
		console.log(`Error deleting file ${id}.png from S3`, err);
	}
}
