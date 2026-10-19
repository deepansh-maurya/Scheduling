import { Job, Worker } from "bullmq";
import ollama from "ollama";
import { redisClient } from "../config/redis.config";
import { AppDataSource } from "../config/database.config";
import { Resource } from "../database/entities/resources.entity";
import { ResourceChunk } from "../database/entities/resource-chunks.entity";
import { minioClient } from "../config/minio.config";
import { createInterface } from "node:readline";

export const resourceWorker = new Worker(
  "process-file",
  async (job: Job) => {
    try {
      const resourceRepo = AppDataSource.getRepository(Resource);
      const resourceChunkRepo = AppDataSource.getRepository(ResourceChunk);

      const { fileId, fileType, minioKey } = job.data;
      const resource = await resourceRepo.findOne({ where: { id: fileId } });

      if (fileType == "image/") {
        const response = await ollama.embed({
          model: "nomic-embed-text",
          input: resource?.resourceTxt!
        });

        const chunk = resourceChunkRepo.create({
          resourceId: fileId,
          chunkIndex: 0,
          content: resource?.resourceTxt!,
          embedding: response.embeddings[0],
          startOffset: 0,
          endOffset: resource?.resourceTxt!.split(" ").length
        });

        await resourceChunkRepo.save(chunk);
      } else {
        const bucket = process.env.MINIO_BUCKET!;
        const stream = await minioClient.getObject(bucket, minioKey);

        const lines = createInterface({
          input: stream,
          crlfDelay: Infinity
        });

        let mergedLine = "";
        let lastEmbedding: number[] = [];
        let index = 0;
        let currentOffset = 0;
        let endoffset = 0;

        for await (const line of lines) {
          if (!mergedLine) {
            const response = await ollama.embed({
              model: "nomic-embed-text",
              input: line
            });

            lastEmbedding = response.embeddings[0];

            mergedLine = line;
            currentOffset = 0;
            endoffset = currentOffset + line.length;
          } else {
            const response = await ollama.embed({
              model: "nomic-embed-text",
              input: line
            });

            const currentEmbedding = response.embeddings[0];

            const similarity = cosineSimilarity(
              lastEmbedding,
              currentEmbedding
            );

            if (similarity < 0.8) {
              const chunk = resourceChunkRepo.create({
                resourceId: fileId,
                chunkIndex: index,
                content: resource?.resourceTxt!,
                embedding: currentEmbedding,
                startOffset: currentOffset,
                endOffset: endoffset
              });

              await resourceChunkRepo.save(chunk);
            }

            mergedLine += line;
            lastEmbedding = currentEmbedding;
            currentOffset = endoffset;
            endoffset = currentOffset + line.length;
            index++;
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  },
  {
    connection: redisClient,
    concurrency: 2
  }
);

function cosineSimilarity(a: number[], b: number[]) {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] ** 2;
    normB += b[i] ** 2;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
