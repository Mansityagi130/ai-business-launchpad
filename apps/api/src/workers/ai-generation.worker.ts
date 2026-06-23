import { Worker, Job } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { supabase } from "../config/supabase.js";
import { OpenAIService } from "../services/openai.service.js";
import { PageSchema } from "@launchpad/types";
import { BillingService } from "../services/billing.service.js";

interface GenerationJobData {
  websiteId: string;
  businessId: string;
  templateId?: string;
}

export const aiGenerationWorker = new Worker(
  "ai-generation-queue",
  async (job: Job<GenerationJobData>) => {
    const { websiteId, businessId, templateId } = job.data;
    console.log(`[Worker] Started AI Generation for Website ID: ${websiteId}`);

    // Check spending protection budget limits prior to hitting OpenAI API
    if (await BillingService.isAIQueuePaused()) {
      throw new Error("AI Queue is paused. OpenAI monthly spending budget exceeded.");
    }

    try {
      // 1. Fetch Business Profile
      const { data: business, error: bizErr } = await supabase
        .from("businesses")
        .select()
        .eq("id", businessId)
        .single();

      if (bizErr || !business) {
        throw new Error(`Business profile not found: ${bizErr?.message}`);
      }

      // 2. Fetch Starting Template
      let template: any = null;
      if (templateId) {
        const { data: temp, error: tempErr } = await supabase
          .from("website_templates")
          .select()
          .eq("id", templateId)
          .single();
        if (!tempErr) template = temp;
      }

      // Fallback fallback if template was not fetched
      if (!template) {
        template = {
          theme_config: {
            mode: "light",
            colors: { primary: "#3B82F6", background: "#FFFFFF", text: "#0F172A" },
            typography: { headingFont: "Inter", bodyFont: "Inter", baseFontSize: 16 }
          }
        };
      }

      // Update progress
      await job.updateProgress(20);

      // 3. Generate layout JSON from OpenAI
      const layoutJson = await OpenAIService.generateWebsiteLayout(business, template);
      
      // Increment global monthly spend tracker ($0.08 estimated cost for website generation)
      await BillingService.incrementAISpend(0.08);
      
      await job.updateProgress(60);

      // 4. Save Theme configuration
      const { data: theme } = await supabase
        .from("themes")
        .insert({
          website_id: websiteId,
          mode: layoutJson.theme?.mode || "light",
          colors: layoutJson.theme?.colors || {},
          typography: layoutJson.theme?.typography || {},
          ui_config: layoutJson.theme?.uiConfig || {}
        })
        .select()
        .single();

      // 5. Save Pages and Sections
      const pages = layoutJson.pages || [];
      const dbPagesSnapshot: any[] = [];

      for (const pageData of pages) {
        // Validate Page layout structure
        PageSchema.parse(pageData);

        const { data: page } = await supabase
          .from("pages")
          .insert({
            website_id: websiteId,
            slug: pageData.slug,
            title: pageData.title
          })
          .select()
          .single();

        if (page) {
          const snapshotSections: any[] = [];
          for (const [idx, sec] of pageData.sections.entries()) {
            const { data: section } = await supabase
              .from("sections")
              .insert({
                page_id: page.id,
                type: sec.type,
                order_index: sec.orderIndex || (idx + 1.0),
                component_version: sec.componentVersion || "1.0",
                content: {
                  title: sec.title,
                  subtitle: sec.subtitle,
                  content: sec.content,
                  items: sec.items,
                  ctaButtons: sec.ctaButtons
                },
                styles_override: sec.stylesOverride || {}
              })
              .select()
              .single();
            if (section) snapshotSections.push(section);
          }
          dbPagesSnapshot.push({ ...page, sections: snapshotSections });
        }
      }

      await job.updateProgress(80);

      // 6. Record Version Snapshot
      const { data: version } = await supabase
        .from("website_versions")
        .insert({
          website_id: websiteId,
          version_number: 1,
          pages_snapshot: { pages: dbPagesSnapshot },
          change_summary: "AI Website Generation Completed"
        })
        .select()
        .single();

      if (version) {
        // Update website active version reference
        await supabase
          .from("websites")
          .update({ active_version_id: version.id })
          .eq("id", websiteId);
      }

      await job.updateProgress(100);
      console.log(`[Worker] Finished AI Generation successfully for Website ID: ${websiteId}`);
      return { status: "completed", websiteId };
    } catch (error: any) {
      console.error(`[Worker] Error running AI Generation job:`, error);
      throw error; // Let BullMQ retry
    }
  },
  {
    connection: redisConnection as any,
    concurrency: 2
  }
);
