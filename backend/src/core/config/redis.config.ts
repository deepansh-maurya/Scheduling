import { createClient } from "redis";

export const redisClient = createClient({
  url: process.env.REDIS_URL
});

redisClient.on("error", (err) => {
  console.error("Redis Client Error", err);
});

export const redisPubSub = redisClient.duplicate();

redisPubSub.on("error", (err) => {
  console.error("Redis PubSub Error", err);
});

export const connectRedis = async () => {
  await redisClient.connect();
  await redisPubSub.connect();
};
