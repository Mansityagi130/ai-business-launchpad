import { Response } from "express";
import { supabase } from "../config/supabase.js";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";

export class NotificationController {
  // 1. LIST User notifications
  static async list(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user.id;

      const { data, error } = await supabase
        .from("notifications")
        .select()
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) throw error;

      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: err.message || err }
      });
    }
  }

  // 2. MARK notification as read
  static async markRead(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const { data, error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();

      if (error || !data) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Notification was not found or access denied." }
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
