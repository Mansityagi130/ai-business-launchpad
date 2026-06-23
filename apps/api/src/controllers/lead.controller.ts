import { Request, Response } from "express";
import { z } from "zod";
import { supabase } from "../config/supabase.js";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { NotificationService } from "../services/notification.service.js";

// Input validation schemas
const CaptureLeadDto = z.object({
  websiteId: z.string().uuid("Invalid website UUID"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  message: z.string().optional()
});

const UpdateLeadStatusDto = z.object({
  status: z.enum(["new", "contacted", "qualified", "won", "lost"])
});

export class LeadController {
  // 1. CAPTURE Lead (Public endpoint called from visitor contact forms)
  static async capture(req: Request, res: Response) {
    try {
      const body = CaptureLeadDto.parse(req.body);

      // Verify website exists and is published
      const { data: website } = await supabase
        .from("websites")
        .select("id, status")
        .eq("id", body.websiteId)
        .single();

      if (!website) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Target website configuration was not found." }
        });
      }

      // Insert raw lead details
      const { data: lead, error } = await supabase
        .from("leads")
        .insert({
          website_id: body.websiteId,
          name: body.name,
          email: body.email,
          phone: body.phone,
          message: body.message,
          status: "new"
        })
        .select()
        .single();

      if (error) throw error;

      // Dispatch event notifications asynchronously
      NotificationService.triggerEventNotification("LeadCaptured", {
        websiteId: body.websiteId,
        leadName: body.name
      });

      return res.status(201).json({ success: true, data: lead });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: { code: "BAD_REQUEST", message: err.message || err }
      });
    }
  }

  // 2. LIST Website Leads (Internal protected endpoint)
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

      const { data: leads, error } = await supabase
        .from("leads")
        .select()
        .eq("website_id", websiteId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return res.json({ success: true, data: leads });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: err.message || err }
      });
    }
  }

  // 3. UPDATE Lead Status (Internal CRM status adjustments)
  static async updateStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { leadId } = req.params;
      const ownerId = req.user.id;
      const body = UpdateLeadStatusDto.parse(req.body);

      // Verify lead belongs to a website owned by the user
      const { data: lead } = await supabase
        .from("leads")
        .select("id, website_id, websites (owner_id)")
        .eq("id", leadId)
        .single();

      if (!lead || (lead.websites as any).owner_id !== ownerId) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Lead was not found or access denied." }
        });
      }

      // Update lead status
      const { data: updatedLead, error } = await supabase
        .from("leads")
        .update({ status: body.status })
        .eq("id", leadId)
        .select()
        .single();

      if (error) throw error;

      return res.json({ success: true, data: updatedLead });
    } catch (err: any) {
      return res.status(450).json({
        success: false,
        error: { code: "BAD_REQUEST", message: err.message || err }
      });
    }
  }
}
