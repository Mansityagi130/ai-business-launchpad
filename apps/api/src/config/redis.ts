import { Redis } from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

export const redisConnection = new Redis(redisUrl, {
  maxRetriesPerRequest: null, // Required by BullMQ
});
