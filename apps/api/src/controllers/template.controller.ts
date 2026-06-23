import { Request, Response } from "express";
import { supabase } from "../config/supabase.js";

export class TemplateController {
  // 1. LIST all available website templates
  static async list(req: Request, res: Response) {
    try {
      const { category } = req.query;
      let query = supabase.from("website_templates").select("id, name, description, category, thumbnail_url");

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query.order("name", { ascending: true });

      if (error) throw error;

      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: err.message || err }
      });
    }
  }

  // 2. VIEW specific template details (Full theme and pages schema)
  static async get(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from("website_templates")
        .select()
        .eq("id", id)
        .single();

      if (error || !data) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Template was not found." }
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
}
