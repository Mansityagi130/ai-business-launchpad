import { supabase } from "../config/supabase.js";

export class NotificationService {
  /**
   * 1. CREATE and store user notification record
   */
  static async createNotification(userId: string, title: string, message: string, type: "LeadCaptured" | "WebsitePublished" | "AIGenerationCompleted") {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .insert({
          user_id: userId,
          title,
          message,
          type,
          is_read: false
        })
        .select()
        .single();

      if (error) throw error;
      console.log(`[Notification] Created notification ID: ${data.id} for User: ${userId}`);
      return data;
    } catch (e) {
      console.error("Failed to persist notification record:", e);
      return null;
    }
  }

  /**
   * 2. EVENT ROUTER
   * Receives transactional events and dispatches notifications
   */
  static async triggerEventNotification(
    event: "LeadCaptured" | "WebsitePublished" | "AIGenerationCompleted",
    payload: any
  ) {
    console.log(`[Event Bus] Dispatching notifications for event: ${event}`);

    try {
      if (event === "LeadCaptured") {
        const { websiteId, leadName } = payload;
        
        // Find owner of website
        const { data: website } = await supabase
          .from("websites")
          .select("owner_id, businesses (name)")
          .eq("id", websiteId)
          .single();

        if (website) {
          const ownerId = website.owner_id;
          const businessName = (website.businesses as any)?.name || "your business";
          await this.createNotification(
            ownerId,
            "New Lead Received 🚀",
            `A new visitor contact form was submitted by ${leadName} on ${businessName}.`,
            "LeadCaptured"
          );
        }
      } else if (event === "WebsitePublished") {
        const { websiteId, url } = payload;

        const { data: website } = await supabase
          .from("websites")
          .select("owner_id")
          .eq("id", websiteId)
          .single();

        if (website) {
          await this.createNotification(
            website.owner_id,
            "Website Published Live! 🎉",
            `Your website setup is now active at ${url}.`,
            "WebsitePublished"
          );
        }
      } else if (event === "AIGenerationCompleted") {
        const { websiteId } = payload;

        const { data: website } = await supabase
          .from("websites")
          .select("owner_id")
          .eq("id", websiteId)
          .single();

        if (website) {
          await this.createNotification(
            website.owner_id,
            "AI Website Ready ✨",
            "Your website structure has been generated. Open the editor canvas to check it out.",
            "AIGenerationCompleted"
          );
        }
      }
    } catch (err) {
      console.error("Failed to parse event and send notifications:", err);
    }
  }
}
