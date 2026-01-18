import { Storage } from "@google-cloud/storage";
import dotenv from "dotenv";
dotenv.config();

const storage = new Storage();

if (!process.env.GCS_BUCKET_NAME) {
    throw new Error("GCS_BUCKET_NAME is not defined in environment variables");
}

export const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);