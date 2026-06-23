import { Response } from "express";
import { z } from "zod";
import { supabase } from "../config/supabase.js";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";

// Input Validation Schemas
const CreateBusinessDto = z.object({
  name: z.string().min(1, "Business name is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().min(1, "Description is required"),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  address: z.string().optional(),
  businessHours: z.record(z.string()).optional()
});

const UpdateBusinessDto = CreateBusinessDto.partial();

export class BusinessController {
  // 1. CREATE Business
  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const body = CreateBusinessDto.parse(req.body);
      const ownerId = req.user.id;

      const { data, error } = await supabase
        .from("businesses")
        .insert({
          owner_id: ownerId,
          name: body.name,
          category: body.category,
          description: body.description,
          phone: body.phone,
          whatsapp: body.whatsapp,
          address: body.address,
          business_hours: body.businessHours || {}
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({ success: true, data });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: { code: "BAD_REQUEST", message: err.message || err }
      });
    }
  }

  // 2. READ All User's Businesses
  static async list(req: AuthenticatedRequest, res: Response) {
    try {
      const ownerId = req.user.id;

      const { data, error } = await supabase
        .from("businesses")
        .select()
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

  // 3. READ Specific Business Details
  static async get(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const ownerId = req.user.id;

      const { data, error } = await supabase
        .from("businesses")
        .select()
        .eq("id", id)
        .eq("owner_id", ownerId)
        .single();

      if (error || !data) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Business profile was not found." }
        });
      }

      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: err.message || err }
      });
    }
  }

  // 4. UPDATE Business
  static async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const ownerId = req.user.id;
      const body = UpdateBusinessDto.parse(req.body);

      const { data, error } = await supabase
        .from("businesses")
        .update({
          name: body.name,
          category: body.category,
          description: body.description,
          phone: body.phone,
          whatsapp: body.whatsapp,
          address: body.address,
          business_hours: body.businessHours
        })
        .eq("id", id)
        .eq("owner_id", ownerId)
        .select()
        .single();

      if (error || !data) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Business was not found or access denied." }
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

  // 5. DELETE Business
  static async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const ownerId = req.user.id;

      const { data, error } = await supabase
        .from("businesses")
        .delete()
        .eq("id", id)
        .eq("owner_id", ownerId)
        .select();

      if (error || !data || data.length === 0) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Business was not found or access denied." }
        });
      }

      return res.json({ success: true, message: "Business profile deleted successfully." });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: err.message || err }
      });
    }
  }
}
