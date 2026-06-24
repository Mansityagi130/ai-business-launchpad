import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { BusinessController } from "../controllers/business.controller.js";
import { WebsiteController } from "../controllers/website.controller.js";
import { TemplateController } from "../controllers/template.controller.js";
import { ThemeController } from "../controllers/theme.controller.js";
import { DomainController } from "../controllers/domain.controller.js";
import { LeadController } from "../controllers/lead.controller.js";
import { AnalyticsController } from "../controllers/analytics.controller.js";
import { NotificationController } from "../controllers/notification.controller.js";
import { SystemController } from "../controllers/system.controller.js";

// Import hardening and billing middlewares
import { enforceWebsiteLimit, enforceAIEditLimit } from "../middleware/billing.middleware.js";
import { rateLimiter, xssSanitizer, promptInjectionCheck } from "../middleware/security.middleware.js";

export const router = Router();

// ==========================================
// 1. SYSTEM LIVENESS & OBSERVABILITY (Public)
// ==========================================
router.get("/health", SystemController.health);
router.get("/ready", SystemController.ready);
router.get("/debug/redis", SystemController.debugRedis);
router.get("/admin/system-status", SystemController.systemStatus);

// ==========================================
// 2. PUBLIC TENANT GATEWAYS (Security filter applied)
// ==========================================
router.get(
  "/tenant/resolve",
  rateLimiter(200, 60), // 200 requests per minute
  xssSanitizer,
  WebsiteController.resolveTenant
);

router.post(
  "/tenant/analytics/event",
  rateLimiter(300, 60), // 300 analytics events per minute
  xssSanitizer,
  (req, res) => {
    res.status(201).json({
      success: true,
      message: "Recording raw tenant visitor tracking event"
    });
  }
);

router.post(
  "/tenant/leads",
  rateLimiter(50, 60), // max 50 lead forms per minute per IP
  xssSanitizer,
  LeadController.capture
);

// ==========================================
// 3. INTERNAL AUTHENTICATED APIs (JWT Required)
// ==========================================

// --- BILLING USAGE & QUOTAS ---
router.get("/internal/billing/usage", requireAuth, SystemController.getBillingUsage);

// --- BUSINESS PROFILE ROUTES ---
router.get("/internal/businesses", requireAuth, BusinessController.list);
router.post("/internal/businesses", requireAuth, xssSanitizer, BusinessController.create);
router.get("/internal/businesses/:id", requireAuth, BusinessController.get);
router.put("/internal/businesses/:id", requireAuth, xssSanitizer, BusinessController.update);
router.delete("/internal/businesses/:id", requireAuth, BusinessController.delete);

// --- WEBSITE BUILDER ROUTES ---
router.get("/internal/websites", requireAuth, WebsiteController.list);
router.post(
  "/internal/websites",
  requireAuth,
  enforceWebsiteLimit, // Gated by subscription limit
  xssSanitizer,
  WebsiteController.create
);
router.get("/internal/websites/:id", requireAuth, WebsiteController.get);
router.put("/internal/websites/:id", requireAuth, xssSanitizer, WebsiteController.update);
router.delete("/internal/websites/:id", requireAuth, WebsiteController.delete);
router.post("/internal/websites/:id/publish", requireAuth, WebsiteController.publish);
router.post("/internal/websites/:id/unpublish", requireAuth, WebsiteController.unpublish);
router.get("/internal/websites/:id/publish/status", requireAuth, WebsiteController.getPublishStatus);

// --- LEAD CRM ROUTES ---
router.get("/internal/websites/:websiteId/leads", requireAuth, LeadController.list);
router.put("/internal/leads/:leadId/status", requireAuth, LeadController.updateStatus);

// --- ANALYTICS DASHBOARD ROUTES ---
router.get("/internal/websites/:websiteId/analytics", requireAuth, AnalyticsController.getSummary);

// --- NOTIFICATION CENTER ROUTES ---
router.get("/internal/notifications", requireAuth, NotificationController.list);
router.put("/internal/notifications/:id/read", requireAuth, NotificationController.markRead);

// --- THEME MANIPULATION ROUTES ---
router.get("/internal/websites/:websiteId/theme", requireAuth, ThemeController.get);
router.put("/internal/websites/:websiteId/theme", requireAuth, ThemeController.update);

// --- DOMAIN REGISTRY ROUTES ---
router.get("/internal/websites/:websiteId/domains", requireAuth, DomainController.list);
router.post("/internal/websites/:websiteId/domains", requireAuth, xssSanitizer, DomainController.create);
router.put("/internal/domains/:domainId/verify", requireAuth, DomainController.verify);

// --- TEMPLATE DIRECTORY ROUTES ---
router.get("/internal/templates", requireAuth, TemplateController.list);
router.get("/internal/templates/:id", requireAuth, TemplateController.get);

// --- ASYNC AI JOBS MONITORING & OPERATIONS ---
router.post(
  "/internal/websites/generate-async",
  requireAuth,
  enforceWebsiteLimit, // Check site limit prior to queueing a generation
  xssSanitizer,
  (req, res) => {
    res.status(202).json({
      success: true,
      jobId: "job-id-gen-placeholder",
      status: "queued"
    });
  }
);

router.post(
  "/internal/websites/:id/edit-async",
  requireAuth,
  enforceAIEditLimit, // Gated by edits limits
  promptInjectionCheck, // Prevent prompt inject payloads
  xssSanitizer,
  WebsiteController.editAsync
);
router.post("/internal/websites/:id/rollback", requireAuth, WebsiteController.rollback);

router.get("/internal/websites/jobs/:jobId", requireAuth, WebsiteController.getJobStatus);

router.get("/internal/feature-flags", requireAuth, async (req, res) => {
  res.json({
    success: true,
    data: {
      "ai-logo-generation": true,
      "domain-mapping-ssl": false,
      "EARLY_ACCESS_V1": true
    }
  });
});
