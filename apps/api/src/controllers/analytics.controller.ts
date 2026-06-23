import { Response } from "express";
import { supabase } from "../config/supabase.js";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";

export class AnalyticsController {
  // 1. GET Website Analytics Dashboard summary metrics
  static async getSummary(req: AuthenticatedRequest, res: Response) {
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

      // Query aggregated analytics summaries from DB
      const { data: summaries } = await supabase
        .from("analytics_summaries")
        .select("page_slug, event_type, total_count, unique_visitor_count")
        .eq("website_id", websiteId);

      // Query total leads count from CRM
      const { count: totalLeads } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("website_id", websiteId);

      // Compute aggregates
      let pageviews = 0;
      let uniqueVisitors = 0;
      const topPagesMap: Record<string, number> = {};

      if (summaries) {
        for (const row of summaries) {
          if (row.event_type === "pageview") {
            pageviews += row.total_count || 0;
            uniqueVisitors += row.unique_visitor_count || 0;
            
            // Accumulate top pages
            topPagesMap[row.page_slug] = (topPagesMap[row.page_slug] || 0) + (row.total_count || 0);
          }
        }
      }

      // Format top pages list
      const topPages = Object.entries(topPagesMap)
        .map(([slug, count]) => ({ slug, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate conversion rate
      const leads = totalLeads || 0;
      const conversionRate = uniqueVisitors > 0 ? ((leads / uniqueVisitors) * 100).toFixed(2) + "%" : "0.00%";

      // Mock traffic sources for offline fallback/baseline representation in Sprint 8
      const trafficSources = [
        { source: "Google Search", percentage: 55 },
        { source: "Direct traffic", percentage: 25 },
        { source: "WhatsApp Share", percentage: 12 },
        { source: "Social Media", percentage: 8 }
      ];

      return res.json({
        success: true,
        data: {
          pageviews,
          uniqueVisitors,
          leadsGenerated: leads,
          conversionRate,
          topPages,
          trafficSources
        }
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: err.message || err }
      });
    }
  }
}
