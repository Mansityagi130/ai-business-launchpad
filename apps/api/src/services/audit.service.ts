import { supabase } from "../config/supabase.js";
import { LoggerService } from "./logger.service.js";

export class AuditService {
  /**
   * Records a user/system action into the audit logs database.
   */
  static async logAction(params: {
    userId: string | null;
    action: string;
    ipAddress?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      const ip = params.ipAddress || "127.0.0.1";
      const meta = params.metadata || {};

      const { error } = await supabase.from("audit_logs").insert({
        user_id: params.userId,
        action: params.action,
        ip_address: ip,
        metadata: meta
      });

      if (error) throw error;

      // Also log locally to console/structured logging
      LoggerService.info(`Audit Log: [${params.action}] by ${params.userId || "SYSTEM"}`, {
        ipAddress: ip,
        metadata: meta
      });
    } catch (err: any) {
      LoggerService.error("Failed to insert audit log record", err, {
        userId: params.userId,
        action: params.action
      });
    }
  }
}
