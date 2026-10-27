import { randomUUID } from "crypto";
import { minioClient } from "../config/minio.config";

const bucket = process.env.MINIO_BUCKET!;

export const uploadToMinio = async (
  userId: string,
  file: Express.Multer.File,
  meetingId: string
) => {
  try {
    const objectKey = `resources/${userId}/${meetingId}/${randomUUID()}-${file.originalname}`;

    const exists = await minioClient.bucketExists(bucket);

    if (!exists) {
      await minioClient.makeBucket(bucket);
    }

    await minioClient.putObject(bucket, objectKey, file.buffer, file.size, {
      "Content-Type": file.mimetype
    });

    return {
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      bucket,
      objectKey
    };
  } catch (error) {
    throw error;
  }
};
