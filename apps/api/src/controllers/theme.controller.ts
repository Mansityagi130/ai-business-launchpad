import { Response } from "express";
import { ThemeSchema } from "@launchpad/types";
import { supabase } from "../config/supabase.js";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";

export class ThemeController {
  // 1. READ Theme config for website
  static async get(req: AuthenticatedRequest, res: Response) {
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

      // Fetch theme
      const { data: theme, error } = await supabase
        .from("themes")
        .select()
        .eq("website_id", websiteId)
        .single();

      if (error || !theme) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Theme configuration was not found." }
        });
      }

      return res.json({ success: true, data: theme });
    } catch (err: any) {
      return res.status(550).json({
        success: false,
        error: { code: "SERVER_ERROR", message: err.message || err }
      });
    }
  }

  // 2. UPDATE Theme configuration
  static async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { websiteId } = req.params;
      const ownerId = req.user.id;

      // Validate request body against Theme schema from packages/types
      const body = ThemeSchema.parse(req.body);

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

      // Update Theme record
      const { data: theme, error } = await supabase
        .from("themes")
        .update({
          mode: body.mode,
          colors: body.colors,
          typography: body.typography,
          ui_config: body.uiConfig
        })
        .eq("website_id", websiteId)
        .select()
        .single();

      if (error) throw error;

      return res.json({ success: true, data: theme });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: { code: "BAD_REQUEST", message: err.message || err }
      });
    }
  }
}
