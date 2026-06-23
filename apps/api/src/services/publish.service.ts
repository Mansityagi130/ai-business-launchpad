import { redisConnection } from "../config/redis.js";
import { supabase } from "../config/supabase.js";

export class PublishService {
  /**
   * 1. PUBLISH Website configuration live
   */
  static async publishWebsite(websiteId: string) {
    // Fetch website full pages data to cache
    const { data: website } = await supabase
      .from("websites")
      .select(`
        id, status, created_at,
        businesses ( name, phone, whatsapp ),
        themes ( mode, colors, typography, ui_config )
      `)
      .eq("id", websiteId)
      .single();

    if (!website) throw new Error("Website not found.");

    const { data: pages } = await supabase
      .from("pages")
      .select(`
        id, slug, title,
        sections ( id, type, order_index, component_version, content, styles_override )
      `)
      .eq("website_id", websiteId);

    const mappedPages = (pages || []).map((page: any) => ({
      ...page,
      sections: (page.sections || []).sort((a: any, b: any) => Number(a.order_index) - Number(b.order_index))
    }));

    const websiteData = { ...website, pages: mappedPages };

    // Fetch domains linked to website
    const { data: domains } = await supabase
      .from("domains")
      .select("domain_name")
      .eq("website_id", websiteId);

    // Save site layout cache in Redis
    await redisConnection.set(`site:layout:${websiteId}`, JSON.stringify(websiteData), "EX", 3600); // 1 hour TTL

    // Map associated subdomains & custom domains to website ID in Redis
    if (domains) {
      for (const d of domains) {
        await redisConnection.set(`domain:resolve:${d.domain_name}`, websiteId, "EX", 86400); // 24 hours TTL
      }
    }

    // Update publishing status to published in Database
    await supabase
      .from("websites")
      .update({ status: "published" })
      .eq("id", websiteId);

    console.log(`[Event] WebsitePublished emitted for Website ID: ${websiteId}`);
  }

  /**
   * 2. UNPUBLISH Website configuration
   */
  static async unpublishWebsite(websiteId: string) {
    const { data: domains } = await supabase
      .from("domains")
      .select("domain_name")
      .eq("website_id", websiteId);

    // Clear site layout cache
    await redisConnection.del(`site:layout:${websiteId}`);

    // Clear domain lookups
    if (domains) {
      for (const d of domains) {
        await redisConnection.del(`domain:resolve:${d.domain_name}`);
      }
    }

    // Set website status back to draft in Database
    await supabase
      .from("websites")
      .update({ status: "draft" })
      .eq("id", websiteId);

    console.log(`[Event] WebsiteUnpublished emitted for Website ID: ${websiteId}`);
  }

  /**
   * 3. CACHE INVALIDATION & REVALIDATION
   * Clears layout cache upon edit events
   */
  static async invalidateCache(websiteId: string) {
    await redisConnection.del(`site:layout:${websiteId}`);
    console.log(`[Event] WebsiteEdited received. Invalidating cache for site: ${websiteId}`);
  }

  /**
   * 4. RESOLVE Domain to Website schema details
   */
  static async resolveDomain(hostname: string) {
    // Check Redis lookup cache first
    let websiteId = await redisConnection.get(`domain:resolve:${hostname}`);

    if (!websiteId) {
      // Fallback query Database for verified domains mapping
      const { data: domain } = await supabase
        .from("domains")
        .select("website_id")
        .eq("domain_name", hostname)
        .eq("verification_status", "verified")
        .single();

      if (!domain) return null;
      websiteId = domain.website_id;
      // Seed Redis cache
      await redisConnection.set(`domain:resolve:${hostname}`, websiteId!, "EX", 86400);
    }

    // Check Redis layout cache
    let layout = await redisConnection.get(`site:layout:${websiteId!}`);
    if (layout) {
      return JSON.parse(layout);
    }

    // Fetch from Postgres if cache is empty
    const { data: website } = await supabase
      .from("websites")
      .select(`
        id, status, created_at,
        businesses ( name, phone, whatsapp ),
        themes ( mode, colors, typography, ui_config )
      `)
      .eq("id", websiteId)
      .single();

    if (!website) return null;

    const { data: pages } = await supabase
      .from("pages")
      .select(`
        id, slug, title,
        sections ( id, type, order_index, component_version, content, styles_override )
      `)
      .eq("website_id", websiteId);

    const mappedPages = (pages || []).map((page: any) => ({
      ...page,
      sections: (page.sections || []).sort((a: any, b: any) => Number(a.order_index) - Number(b.order_index))
    }));

    const websiteData = { ...website, pages: mappedPages };

    // Seed Redis layout cache
    await redisConnection.set(`site:layout:${websiteId}`, JSON.stringify(websiteData), "EX", 3600);
    return websiteData;
  }
}
