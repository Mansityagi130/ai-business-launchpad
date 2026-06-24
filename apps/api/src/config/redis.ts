import { Redis } from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

// Track the last encountered Redis error for debug diagnostics
export let lastRedisError: any = null;

const redisOptions: any = {
  maxRetriesPerRequest: null, // Required by BullMQ
};

// Add explicit TLS configuration if using a secure rediss:// connection (like Upstash)
if (redisUrl.startsWith("rediss://")) {
  redisOptions.tls = {
    rejectUnauthorized: false,
  };
}

export const redisConnection = new Redis(redisUrl, redisOptions);

// Add Redis connection lifecycle logging
redisConnection.on("connect", () => {
  console.log("[Redis Connection Lifecycle] Connection established (connect event).");
});

redisConnection.on("ready", () => {
  console.log("[Redis Connection Lifecycle] Redis client is ready (ready event).");
});

redisConnection.on("error", (err) => {
  lastRedisError = {
    message: err.message,
    name: err.name,
    stack: err.stack,
    timestamp: new Date().toISOString(),
  };
  console.error("[Redis Connection Lifecycle] Client error event occurred:", err.message || err);
});

redisConnection.on("close", () => {
  console.log("[Redis Connection Lifecycle] Connection closed (close event).");
});

redisConnection.on("reconnecting", (delay: number) => {
  console.log(`[Redis Connection Lifecycle] Reconnecting in ${delay}ms...`);
});
