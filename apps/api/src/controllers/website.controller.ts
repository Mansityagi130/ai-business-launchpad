import { Response, Request } from "express";
import { z } from "zod";
import { supabase } from "../config/supabase.js";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { aiGenerationQueue, aiEditQueue } from "../config/bullmq.js";
import { PublishService } from "../services/publish.service.js";
import { BillingService } from "../services/billing.service.js";
import { AuditService } from "../services/audit.service.js";

// Input Validation
const CreateWebsiteDto = z.object({
  businessId: z.string().uuid("Invalid business UUID"),
  templateId: z.string().uuid().optional(),
  subdomain: z.string().regex(/^[a-z0-9-]+$/, "Subdomain must be lowercase-kebab-case")
});

const UpdateWebsiteDto = z.object({
  status: z.enum(["draft", "published"]).optional(),
  activeVersionId: z.string().uuid().optional()
});

const EditWebsiteDto = z.object({
  instruction: z.string().min(1, "Instruction prompt is required")
});

const RollbackDto = z.object({
  versionNumber: z.number().int().positive("Invalid version number")
});

export class WebsiteController {
  // 1. CREATE Website Async
  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const body = CreateWebsiteDto.parse(req.body);
      const ownerId = req.user.id;

      // Check OpenAI spending protection limits
      if (await BillingService.isAIQueuePaused()) {
        return res.status(403).json({
          success: false,
          code: "AI_BUDGET_EXCEEDED",
          message: "AI services are temporarily unavailable due to system budget limits. Please try again later."
        });
      }

      const { data: business } = await supabase
        .from("businesses")
        .select()
        .eq("id", body.businessId)
        .eq("owner_id", ownerId)
        .single();

      if (!business) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Business profile was not found." }
        });
      }

      const { data: existingDomain } = await supabase
        .from("domains")
        .select()
        .eq("domain_name", `${body.subdomain}.launchpad.ai`)
        .single();

      if (existingDomain) {
        return res.status(409).json({
          success: false,
          error: { code: "CONFLICT", message: "Subdomain is already registered." }
        });
      }

      const { data: website, error: websiteError } = await supabase
        .from("websites")
        .insert({
          business_id: body.businessId,
          owner_id: ownerId,
          template_id: body.templateId,
          status: "draft"
        })
        .select()
        .single();

      if (websiteError || !website) throw websiteError;

      await supabase
        .from("domains")
        .insert({
          website_id: website.id,
          domain_name: `${body.subdomain}.launchpad.ai`,
          type: "subdomain",
          verification_status: "verified",
          ssl_status: "active"
        });

      // Queue AI Generation Job
      const job = await aiGenerationQueue.add(`gen-${website.id}`, {
        websiteId: website.id,
        businessId: body.businessId,
        templateId: body.templateId
      });

      // Increment AI generations usage track
      await BillingService.incrementGenerationCount(ownerId);
      // Increment active websites count
      await BillingService.incrementWebsiteCount(ownerId);

      // Audit Log creation
      await AuditService.logAction({
        userId: ownerId,
        action: "WEBSITE_CREATE",
        ipAddress: req.ip,
        metadata: { websiteId: website.id, businessId: body.businessId, jobId: job.id }
      });

      return res.status(202).json({
        success: true,
        message: "AI Website Generation queued successfully.",
        jobId: job.id,
        websiteId: website.id,
        status: "queued"
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: { code: "BAD_REQUEST", message: err.message || err }
      });
    }
  }

  // 2. CONVERSATIONAL EDIT Async
  static async editAsync(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const ownerId = req.user.id;
      const body = EditWebsiteDto.parse(req.body);

      // Check OpenAI spending protection limits
      if (await BillingService.isAIQueuePaused()) {
        return res.status(403).json({
          success: false,
          code: "AI_BUDGET_EXCEEDED",
          message: "AI services are temporarily unavailable due to system budget limits. Please try again later."
        });
      }

      const { data: website } = await supabase
        .from("websites")
        .select("id")
        .eq("id", id)
        .eq("owner_id", ownerId)
        .single();

      if (!website) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Website was not found or access denied." }
        });
      }

      // Add task to job queue
      const job = await aiEditQueue.add(`edit-${id}`, {
        websiteId: id,
        instruction: body.instruction,
        userId: ownerId
      });

      // Increment edits usage counter
      await BillingService.incrementAIEditCount(ownerId);

      // Audit Log editing trigger
      await AuditService.logAction({
        userId: ownerId,
        action: "WEBSITE_EDIT_ASYNC",
        ipAddress: req.ip,
        metadata: { websiteId: id, jobId: job.id, instruction: body.instruction }
      });

      return res.status(202).json({
        success: true,
        message: "AI edit command queued in background.",
        jobId: job.id,
        status: "queued"
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: { code: "BAD_REQUEST", message: err.message || err }
      });
    }
  }

  // 3. PUBLISH Website live
  static async publish(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const ownerId = req.user.id;

      // Verify ownership
      const { data: website } = await supabase
        .from("websites")
        .select("id")
        .eq("id", id)
        .eq("owner_id", ownerId)
        .single();

      if (!website) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Website was not found or access denied." }
        });
      }

      await PublishService.publishWebsite(id);

      // Audit Log publishing
      await AuditService.logAction({
        userId: ownerId,
        action: "WEBSITE_PUBLISH",
        ipAddress: req.ip,
        metadata: { websiteId: id }
      });

      return res.json({
        success: true,
        message: "Website configuration published live."
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: err.message || err }
      });
    }
  }

  // 4. UNPUBLISH Website
  static async unpublish(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const ownerId = req.user.id;

      // Verify ownership
      const { data: website } = await supabase
        .from("websites")
        .select("id")
        .eq("id", id)
        .eq("owner_id", ownerId)
        .single();

      if (!website) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Website was not found or access denied." }
        });
      }

      await PublishService.unpublishWebsite(id);

      // Audit Log unpublishing
      await AuditService.logAction({
        userId: ownerId,
        action: "WEBSITE_UNPUBLISH",
        ipAddress: req.ip,
        metadata: { websiteId: id }
      });

      return res.json({
        success: true,
        message: "Website configuration unpublished successfully."
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: err.message || err }
      });
    }
  }

  // 5. GET PUBLISH Status
  static async getPublishStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const ownerId = req.user.id;

      const { data: website, error } = await supabase
        .from("websites")
        .select("id, status")
        .eq("id", id)
        .eq("owner_id", ownerId)
        .single();

      if (error || !website) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Website was not found or access denied." }
        });
      }

      return res.json({
        success: true,
        data: {
          websiteId: website.id,
          status: website.status
        }
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: err.message || err }
      });
    }
  }

  // 6. RESOLVE Public Tenant Layout (Uses Redis cache)
  static async resolveTenant(req: Request, res: Response) {
    try {
      const domain = req.query.domain as string;
      const subdomain = req.query.subdomain as string;
      const hostname = domain || (subdomain ? `${subdomain}.launchpad.ai` : "");

      if (!hostname) {
        return res.status(400).json({
          success: false,
          error: { code: "BAD_REQUEST", message: "Missing domain query parameter." }
        });
      }

      const layout = await PublishService.resolveDomain(hostname);
      if (!layout) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Domain resolution failed. Tenant not found or unverified." }
        });
      }

      return res.json({ success: true, data: layout });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: err.message || err }
      });
    }
  }

  // 7. ROLLBACK (Undo system)
  static async rollback(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const ownerId = req.user.id;
      const body = RollbackDto.parse(req.body);

      const { data: website } = await supabase
        .from("websites")
        .select("id")
        .eq("id", id)
        .eq("owner_id", ownerId)
        .single();

      if (!website) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Website was not found or access denied." }
        });
      }

      const { data: version } = await supabase
        .from("website_versions")
        .select()
        .eq("website_id", id)
        .eq("version_number", body.versionNumber)
        .single();

      if (!version) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Target version snapshot was not found." }
        });
      }

      const snapshot = version.pages_snapshot as any;
      const snapshotPages = snapshot.pages || [];

      await supabase.from("pages").delete().eq("website_id", id);

      for (const p of snapshotPages) {
        const { data: page } = await supabase
          .from("pages")
          .insert({
            website_id: id,
            slug: p.slug,
            title: p.title
          })
          .select()
          .single();

        if (page && p.sections) {
          for (const s of p.sections) {
            await supabase
              .from("sections")
              .insert({
                page_id: page.id,
                type: s.type,
                order_index: s.order_index,
                component_version: s.component_version,
                content: s.content,
                styles_override: s.styles_override
              });
          }
        }
      }

      await supabase
        .from("websites")
        .update({ active_version_id: version.id })
        .eq("id", id);

      // Invalidate Redis cache so that edits populate on live pages immediately
      await PublishService.invalidateCache(id);

      // Audit Log rollback
      await AuditService.logAction({
        userId: ownerId,
        action: "WEBSITE_ROLLBACK",
        ipAddress: req.ip,
        metadata: { websiteId: id, versionNumber: body.versionNumber }
      });

      return res.json({
        success: true,
        message: `Website configuration rolled back to version ${body.versionNumber} successfully.`
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: { code: "BAD_REQUEST", message: err.message || err }
      });
    }
  }

  // 8. READ Jobs Status
  static async getJobStatus(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      
      let job = await aiGenerationQueue.getJob(jobId);
      if (!job) {
        job = await aiEditQueue.getJob(jobId);
      }

      if (!job) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Job was not found." }
        });
      }

      const state = await job.getState();
      let progress = job.progress;
      let error = null;
      let result = null;

      if (state === "failed") {
        error = job.failedReason || "Job execution failed.";
      } else if (state === "completed") {
        result = job.returnvalue;
      }

      return res.json({
        success: true,
        data: {
          jobId,
          status: state === "waiting" || state === "delayed" ? "queued" : state,
          progress,
          result,
          error
        }
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: err.message || err }
      });
    }
  }

  // 9. READ All User's Websites
  static async list(req: AuthenticatedRequest, res: Response) {
    try {
      const ownerId = req.user.id;

      const { data, error } = await supabase
        .from("websites")
        .select(`
          id,
          status,
          created_at,
          businesses ( name, category ),
          domains ( domain_name, type )
        `)
        .eq("owner_id", ownerId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: err.message || err }
      });
    }
  }

  // 10. READ Specific Website Details
  static async get(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const ownerId = req.user.id;

      const { data: website } = await supabase
        .from("websites")
        .select(`
          id, status, created_at,
          businesses ( name, phone, whatsapp ),
          themes ( mode, colors, typography, ui_config )
        `)
        .eq("id", id)
        .eq("owner_id", ownerId)
        .single();

      if (!website) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Website was not found." }
        });
      }

      const { data: pages } = await supabase
        .from("pages")
        .select(`
          id, slug, title,
          sections ( id, type, order_index, component_version, content, styles_override )
        `)
        .eq("website_id", id)
        .order("slug", { ascending: true });

      const mappedPages = (pages || []).map((page: any) => ({
        ...page,
        sections: (page.sections || []).sort((a: any, b: any) => Number(a.order_index) - Number(b.order_index))
      }));

      return res.json({
        success: true,
        data: {
          ...website,
          pages: mappedPages
        }
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: err.message || err }
      });
    }
  }

  // 11. DELETE Website
  static async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const ownerId = req.user.id;

      const { data, error } = await supabase
        .from("websites")
        .delete()
        .eq("id", id)
        .eq("owner_id", ownerId)
        .select();

      if (error || !data || data.length === 0) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Website not found or authorization failed." }
        });
      }

      // Audit Log deletion
      await AuditService.logAction({
        userId: ownerId,
        action: "WEBSITE_DELETE",
        ipAddress: req.ip,
        metadata: { websiteId: id }
      });

      return res.json({ success: true, message: "Website deleted successfully." });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: err.message || err }
      });
    }
  }

  // 12. UPDATE Website (Parameters adjustment)
  static async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const ownerId = req.user.id;
      const body = UpdateWebsiteDto.parse(req.body);

      const { data, error } = await supabase
        .from("websites")
        .update({
          status: body.status,
          active_version_id: body.activeVersionId,
          updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .eq("owner_id", ownerId)
        .select()
        .single();

      if (error || !data) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Website was not found or access denied." }
        });
      }

      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: { code: "BAD_REQUEST", message: err.message || err }
      });
    }
  }
}
