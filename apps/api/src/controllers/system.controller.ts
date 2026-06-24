import { Request, Response } from "express";
import { supabase } from "../config/supabase.js";
import { redisConnection, lastRedisError } from "../config/redis.js";
import { aiGenerationQueue, aiEditQueue } from "../config/bullmq.js";
import { BillingService, PLAN_LIMITS } from "../services/billing.service.js";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";

export class SystemController {
  /**
   * Shallow health check (liveness check)
   */
  static health(req: Request, res: Response) {
    return res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  }

  /**
   * Deep readiness check (verifies DB & Cache connections)
   */
  static async ready(req: Request, res: Response) {
    const checks: Record<string, any> = {
      database: "unknown",
      redis: "unknown"
    };
    let isReady = true;

    console.log("[Readiness Probe] Starting readiness checks...");

    // Check Postgres (Supabase)
    try {
      console.log("[Readiness Probe] Testing Supabase database connection...");
      const dbStart = Date.now();
      const { error } = await supabase.from("feature_flags").select("key").limit(1);
      if (error) throw error;
      console.log(`[Readiness Probe] Supabase responded in ${Date.now() - dbStart}ms`);
      checks.database = { status: "ready", latencyMs: Date.now() - dbStart };
    } catch (err: any) {
      console.error("[Readiness Probe] Supabase check failed:", err.message || err);
      isReady = false;
      checks.database = { status: "failed", error: err.message || err };
    }

    // Check Redis
    try {
      console.log("[Readiness Probe] Testing Redis connection (ping) with 5s timeout...");
      const redisStart = Date.now();
      
      // Wrap Redis ping in a 5-second timeout to prevent indefinite hanging
      await Promise.race([
        redisConnection.ping(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Redis ping timeout after 5000ms")), 5000)
        )
      ]);

      console.log(`[Readiness Probe] Redis responded in ${Date.now() - redisStart}ms`);
      checks.redis = { status: "ready", latencyMs: Date.now() - redisStart };
    } catch (err: any) {
      console.error("[Readiness Probe] Redis check failed:", err.message || err);
      isReady = false;
      checks.redis = { status: "failed", error: err.message || err };
    }

    console.log(`[Readiness Probe] Readiness check complete. Status ready: ${isReady}`);

    const statusCode = isReady ? 200 : 503;
    return res.status(statusCode).json({
      status: isReady ? "ready" : "unready",
      timestamp: new Date().toISOString(),
      services: checks
    });
  }

  /**
   * Admin-only system status monitor dashboard API
   */
  static async systemStatus(req: Request, res: Response) {
    try {
      // 1. Database details
      const dbStart = Date.now();
      const { data: dbCount } = await supabase.from("websites").select("*", { count: "exact", head: true });
      const dbLatency = Date.now() - dbStart;

      // 2. Redis details
      const redisStart = Date.now();
      await redisConnection.ping();
      const redisLatency = Date.now() - redisStart;

      // 3. Queue details
      const genJobCounts = await aiGenerationQueue.getJobCounts();
      const editJobCounts = await aiEditQueue.getJobCounts();

      // 4. OpenAI spending settings
      const openaiStatus = await BillingService.getOpenAISpendingStatus();

      return res.json({
        success: true,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
        infrastructure: {
          database: {
            status: "connected",
            totalWebsitesCount: dbCount || 0,
            latencyMs: dbLatency
          },
          redis: {
            status: "connected",
            latencyMs: redisLatency
          }
        },
        queues: {
          ai_generation: {
            name: "ai-generation-queue",
            jobCounts: genJobCounts
          },
          ai_edit: {
            name: "ai-edit-queue",
            jobCounts: editJobCounts
          }
        },
        platform_settings: openaiStatus
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: err.message || err }
      });
    }
  }

  /**
   * GET /api/v1/internal/billing/usage
   * Return current plan, limits, and usage exact JSON shape
   */
  static async getBillingUsage(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "User session required." }
        });
      }

      const plan = await BillingService.getUserPlan(userId);
      const usage = await BillingService.resetUsageIfCycleExpired(userId);
      const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

      // Realtime website count check
      const { count: websitesCount } = await supabase
        .from("websites")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", userId);

      return res.json({
        plan,
        limits: {
          websites: limits.websites,
          ai_edits: limits.edits
        },
        usage: {
          websites: websitesCount || 0,
          ai_edits: usage?.ai_edits || 0
        },
        billing_cycle_end: usage?.billing_cycle_end || new Date().toISOString()
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: err.message || err }
      });
    }
  }

  /**
   * Temporary debug endpoint to verify Redis connection status and options
   */
  static async debugRedis(req: Request, res: Response) {
    const start = Date.now();
    let pingLatency: number | string = "unknown";
    let pingError: string | null = null;

    try {
      await Promise.race([
        redisConnection.ping(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Redis ping timeout after 3000ms")), 3000)
        )
      ]);
      pingLatency = Date.now() - start;
    } catch (err: any) {
      pingError = err.message || err;
    }

    const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
    let redisHost = "unknown";
    try {
      const urlObj = new URL(redisUrl);
      redisHost = urlObj.host;
    } catch (e) {
      redisHost = redisUrl;
    }

    return res.json({
      status: redisConnection.status, // "close", "connecting", "ready", etc.
      pingLatencyMs: pingLatency,
      pingError,
      redisHost,
      lastConnectionError: lastRedisError,
      timestamp: new Date().toISOString()
    });
  }
}
