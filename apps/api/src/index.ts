import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { router } from "./routes/api.routes.js";
import { aiGenerationWorker } from "./workers/ai-generation.worker.js";
import { aiEditWorker } from "./workers/ai-edit.worker.js";

// Initialize worker background runners
aiGenerationWorker.on("ready", () => {
  console.log("BullMQ AI Generation worker initialized.");
});

aiEditWorker.on("ready", () => {
  console.log("BullMQ AI Edit worker initialized.");
});

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Main API Router mapping
app.use("/api/v1", router);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`Express API Server running at http://localhost:${port}`);
});
