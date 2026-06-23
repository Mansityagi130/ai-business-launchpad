import { Response } from "express";
import { z } from "zod";
import { supabase } from "../config/supabase.js";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { BillingService } from "../services/billing.service.js";

// Input Validation
const AddDomainDto = z.object({
  domainName: z.string().regex(/^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}$/, "Invalid custom domain format")
});

export class DomainController {
  // 1. CREATE Custom Domain Binding
  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { websiteId } = req.params;
      const ownerId = req.user.id;
      const body = AddDomainDto.parse(req.body);

      // Verify custom domain authorization via feature flag check
      const canUseCustom = await BillingService.canUseCustomDomain(ownerId);
      if (!canUseCustom) {
        return res.status(403).json({
          success: false,
          code: "UPGRADE_REQUIRED",
          message: "Custom domains require a Pro, Business, or Agency plan. Please upgrade to bind custom domains."
        });
      }

      // Verify website ownership
      const { data: website } = await supabase
        .from("websites")
        .select("id")
        .eq("id", websiteId)
        .eq("owner_id", ownerId)
        .single();

      if (!website) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Website was not found or access denied." }
        });
      }

      // Generate CNAME instructions
      const dnsRecords = {
        type: "CNAME",
        host: "@",
        required_value: "cname.launchpad.ai"
      };

      const { data: domain, error } = await supabase
        .from("domains")
        .insert({
          website_id: websiteId,
          domain_name: body.domainName,
          type: "custom",
          verification_status: "pending",
          dns_records: dnsRecords,
          ssl_status: "inactive"
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          return res.status(409).json({
            success: false,
            error: { code: "CONFLICT", message: "Domain name is already registered." }
          });
        }
        throw error;
      }

      return res.status(201).json({ success: true, data: domain });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: { code: "BAD_REQUEST", message: err.message || err }
      });
    }
  }

  // 2. READ Domains associated with a website
  static async list(req: AuthenticatedRequest, res: Response) {
    try {
      const { websiteId } = req.params;
      const ownerId = req.user.id;

      // Verify website ownership
      const { data: website } = await supabase
        .from("websites")
        .select("id")
        .eq("id", websiteId)
        .eq("owner_id", ownerId)
        .single();

      if (!website) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Website was not found or access denied." }
        });
      }

      const { data: domains, error } = await supabase
        .from("domains")
        .select()
        .eq("website_id", websiteId);

      if (error) throw error;

      return res.json({ success: true, data: domains });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: err.message || err }
      });
    }
  }

  // 3. UPDATE Domain Verification (Trigger Mock Verification Check)
  static async verify(req: AuthenticatedRequest, res: Response) {
    try {
      const { domainId } = req.params;
      const ownerId = req.user.id;

      // Query domain and joined website to verify ownership
      const { data: domain } = await supabase
        .from("domains")
        .select("id, domain_name, website_id, websites (owner_id)")
        .eq("id", domainId)
        .single();

      if (!domain || (domain.websites as any).owner_id !== ownerId) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Domain binding was not found or access denied." }
        });
      }

      // Mocking verification check success for Sprint 3
      const { data: updatedDomain, error } = await supabase
        .from("domains")
        .update({
          verification_status: "verified",
          ssl_status: "active"
        })
        .eq("id", domainId)
        .select()
        .single();

      if (error) throw error;

      return res.json({
        success: true,
        message: "Domain verified and SSL issued successfully.",
        data: updatedDomain
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: err.message || err }
      });
    }
  }
}
