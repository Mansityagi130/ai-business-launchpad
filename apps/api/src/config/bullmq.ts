import { Queue } from "bullmq";
import { redisConnection } from "./redis.js";

export const aiGenerationQueue = new Queue("ai-generation-queue", {
  connection: redisConnection as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true,
  },
});

export const aiEditQueue = new Queue("ai-edit-queue", {
  connection: redisConnection as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true,
  },
});
