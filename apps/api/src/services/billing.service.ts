import { supabase } from "../config/supabase.js";

export const PLAN_LIMITS: Record<string, { websites: number; edits: number }> = {
  free: { websites: 1, edits: 50 },
  pro: { websites: 5, edits: 500 },
  business: { websites: 20, edits: 5000 },
  agency: { websites: 999999, edits: 999999 }
};

export class BillingService {
  /**
   * Resolves the active subscription plan for a user.
   * If no active subscription exists, defaults to 'free'.
   */
  static async getUserPlan(userId: string): Promise<string> {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan_type, status")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("current_period_end", { ascending: false })
      .limit(1)
      .maybeSingle();

    return sub?.plan_type || "free";
  }

  /**
   * Checks if a user's billing cycle has expired and resets usage counters if so.
   */
  static async resetUsageIfCycleExpired(userId: string) {
    let { data: usage } = await supabase
      .from("usage_tracking")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!usage) {
      // Auto-create usage tracking record if it doesn't exist
      const { data: newUsage } = await supabase
        .from("usage_tracking")
        .insert({
          user_id: userId,
          billing_cycle_start: new Date().toISOString(),
          billing_cycle_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single();
      usage = newUsage;
    }

    if (usage) {
      const now = new Date();
      const cycleEnd = new Date(usage.billing_cycle_end);

      if (now >= cycleEnd) {
        const nextStart = cycleEnd.toISOString();
        const nextEnd = new Date(cycleEnd.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

        const { data: resetUsage } = await supabase
          .from("usage_tracking")
          .update({
            ai_edits: 0,
            ai_generations: 0,
            billing_cycle_start: nextStart,
            billing_cycle_end: nextEnd,
            updated_at: now.toISOString()
          })
          .eq("user_id", userId)
          .select()
          .single();
        usage = resetUsage;
      }
    }
    return usage;
  }

  /**
   * Checks if user has permission to create a website.
   */
  static async canCreateWebsite(userId: string): Promise<boolean> {
    const plan = await this.getUserPlan(userId);
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

    // Realtime check from websites table for accuracy
    const { count } = await supabase
      .from("websites")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", userId);

    return (count || 0) < limits.websites;
  }

  /**
   * Checks if user has enough AI edit quota remaining.
   */
  static async canUseAIEdit(userId: string): Promise<boolean> {
    const plan = await this.getUserPlan(userId);
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

    const usage = await this.resetUsageIfCycleExpired(userId);
    if (!usage) return false;

    return usage.ai_edits < limits.edits;
  }

  /**
   * Increments the user's website creations count.
   */
  static async incrementWebsiteCount(userId: string): Promise<void> {
    const usage = await this.resetUsageIfCycleExpired(userId);
    if (!usage) return;

    await supabase
      .from("usage_tracking")
      .update({ websites_created: usage.websites_created + 1 })
      .eq("user_id", userId);
  }

  /**
   * Increments the user's AI generations count.
   */
  static async incrementGenerationCount(userId: string): Promise<void> {
    const usage = await this.resetUsageIfCycleExpired(userId);
    if (!usage) return;

    await supabase
      .from("usage_tracking")
      .update({ ai_generations: usage.ai_generations + 1 })
      .eq("user_id", userId);
  }

  /**
   * Increments the user's AI edit count.
   */
  static async incrementAIEditCount(userId: string): Promise<void> {
    const usage = await this.resetUsageIfCycleExpired(userId);
    if (!usage) return;

    await supabase
      .from("usage_tracking")
      .update({ ai_edits: usage.ai_edits + 1 })
      .eq("user_id", userId);
  }

  /**
   * Checks if a user is permitted to use a custom domain based on plan and flags.
   */
  static async canUseCustomDomain(userId: string): Promise<boolean> {
    const plan = await this.getUserPlan(userId);
    if (plan !== "free") return true;

    // Check feature flag EARLY_ACCESS_V1
    const { data: flag } = await supabase
      .from("feature_flags")
      .select("is_enabled")
      .eq("key", "EARLY_ACCESS_V1")
      .maybeSingle();

    return flag?.is_enabled ?? false;
  }

  /**
   * Gets OpenAI global budget protection settings from platform_settings table.
   */
  static async getOpenAISpendingStatus() {
    const { data } = await supabase
      .from("platform_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    return data || { monthly_ai_budget: 200.00, monthly_ai_spend: 0.00, ai_generation_enabled: true };
  }

  /**
   * Adds OpenAI consumption cost, pausing queue if limit is hit.
   */
  static async incrementAISpend(cost: number): Promise<void> {
    const status = await this.getOpenAISpendingStatus();
    const newSpend = Number((status.monthly_ai_spend + cost).toFixed(4));
    const shouldDisable = newSpend >= status.monthly_ai_budget;

    await supabase
      .from("platform_settings")
      .update({
        monthly_ai_spend: newSpend,
        ai_generation_enabled: !shouldDisable,
        updated_at: new Date().toISOString()
      })
      .eq("id", 1);

    if (shouldDisable && status.ai_generation_enabled) {
      // Trigger global system notification
      await supabase.from("notifications").insert({
        user_id: null,
        title: "AI Budget Exceeded",
        message: `AI Queue automatically paused. OpenAI monthly spend reached $${newSpend.toFixed(2)} (Budget: $${status.monthly_ai_budget.toFixed(2)}).`,
        type: "system_alert",
        is_read: false
      });
    }
  }

  /**
   * Verifies if OpenAI queue must pause.
   */
  static async isAIQueuePaused(): Promise<boolean> {
    const status = await this.getOpenAISpendingStatus();
    return status.ai_generation_enabled === false || status.monthly_ai_spend >= status.monthly_ai_budget;
  }
}
