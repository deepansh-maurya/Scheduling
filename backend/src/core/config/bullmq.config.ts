import IORedis from "ioredis";
import { Queue } from "bullmq";

export const bullConnection = new IORedis(
  process.env.REDIS_URL ?? "redis://localhost:6379",
  {
    maxRetriesPerRequest: null
  }
);

export const resourceQueue = new Queue("process-file", {
  connection: bullConnection
});
