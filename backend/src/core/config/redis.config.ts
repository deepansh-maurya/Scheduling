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
  if (!redisClient.isOpen) await redisClient.connect();
};

export const connectRedisPubSub = async () => {
  if (!redisPubSub.isOpen) await redisPubSub.connect();
};
