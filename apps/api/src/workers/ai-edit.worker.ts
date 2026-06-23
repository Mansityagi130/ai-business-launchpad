import { Worker, Job } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { supabase } from "../config/supabase.js";
import { AIEditorService } from "../services/ai-editor.service.js";
import { SectionSchema, ThemeSchema } from "@launchpad/types";
import { BillingService } from "../services/billing.service.js";

interface EditJobData {
  websiteId: string;
  instruction: string;
  userId: string;
}

export const aiEditWorker = new Worker(
  "ai-edit-queue",
  async (job: Job<EditJobData>) => {
    const { websiteId, instruction } = job.data;
    console.log(`[Worker] Started AI Edit for Website ID: ${websiteId}, instruction: "${instruction}"`);

    // Check spending protection budget limits prior to hitting OpenAI API
    if (await BillingService.isAIQueuePaused()) {
      throw new Error("AI Queue is paused. OpenAI monthly spending budget exceeded.");
    }

    try {
      // 1. Fetch current full website structure
      const { data: website } = await supabase
        .from("websites")
        .select(`
          id, status,
          themes ( id, mode, colors, typography, ui_config )
        `)
        .eq("id", websiteId)
        .single();

      if (!website) throw new Error("Website configuration not found.");

      const { data: pages } = await supabase
        .from("pages")
        .select(`
          id, slug, title,
          sections ( id, type, order_index, component_version, content, styles_override )
        `)
        .eq("website_id", websiteId);

      const siteStructure = { ...website, pages };

      // 2. Classify instruction intent
      const classification = await AIEditorService.classifyInstruction(instruction, siteStructure);
      
      // Increment global monthly spend tracker ($0.02 estimated cost for classification + edit)
      await BillingService.incrementAISpend(0.02);
      
      console.log(`[Worker] Classified intent: ${classification.intent} on page: ${classification.targetPageSlug}`);

      await job.updateProgress(30);

      let beforeState: any = null;
      let afterState: any = null;
      let changedFields: string[] = [];

      // 3. Process according to intent
      if (classification.intent === "THEME_EDIT") {
        const theme = website.themes as any;
        beforeState = { colors: theme.colors, typography: theme.typography };

        const updatedTheme = await AIEditorService.editThemeConfig(theme, instruction);
        
        // Zod Validate
        ThemeSchema.parse(updatedTheme);

        const { data: savedTheme } = await supabase
          .from("themes")
          .update({
            mode: updatedTheme.mode,
            colors: updatedTheme.colors,
            typography: updatedTheme.typography,
            ui_config: updatedTheme.ui_config
          })
          .eq("id", theme.id)
          .select()
          .single();

        afterState = { colors: savedTheme.colors, typography: savedTheme.typography };
        changedFields = ["theme.colors", "theme.typography"];

      } else if (classification.intent === "SECTION_EDIT" && classification.targetSectionId) {
        // Query target section
        const { data: section } = await supabase
          .from("sections")
          .select()
          .eq("id", classification.targetSectionId)
          .single();

        if (section) {
          beforeState = { content: section.content };

          // Build edit payload context
          const editPayload = {
            id: section.id,
            type: section.type,
            orderIndex: Number(section.order_index),
            componentVersion: section.component_version,
            title: section.content.title,
            subtitle: section.content.subtitle,
            content: section.content.content,
            items: section.content.items,
            ctaButtons: section.content.ctaButtons,
            stylesOverride: section.styles_override
          };

          const updatedSec = await AIEditorService.editSectionContent(editPayload, instruction);
          
          // Zod Validate Section layout config
          SectionSchema.parse(updatedSec);

          const { data: savedSec } = await supabase
            .from("sections")
            .update({
              content: {
                title: updatedSec.title,
                subtitle: updatedSec.subtitle,
                content: updatedSec.content,
                items: updatedSec.items,
                ctaButtons: updatedSec.ctaButtons
              },
              styles_override: updatedSec.stylesOverride || {}
            })
            .eq("id", section.id)
            .select()
            .single();

          afterState = { content: savedSec.content };
          changedFields = [`section.${section.id}.content`];
        }
      } else if (classification.intent === "ADD_SECTION") {
        // Resolve page row
        const targetPage = pages?.find((p) => p.slug === classification.targetPageSlug);
        if (targetPage) {
          // Compute fractional order index placement
          const sections = targetPage.sections || [];
          const maxOrder = sections.reduce((max, s) => Math.max(max, Number(s.order_index)), 0.0);
          const newOrder = maxOrder + 1.0;

          // Generate boilerplate mock section data for addition
          const newSec = {
            title: "New Featured Section",
            subtitle: "Summarize additional features or service credentials here.",
            componentVersion: "1.0",
            type: "features",
            orderIndex: newOrder,
            items: [
              { id: "item-add-1", title: "New Item", description: "Edit details using prompts." }
            ]
          };

          await supabase
            .from("sections")
            .insert({
              page_id: targetPage.id,
              type: newSec.type,
              order_index: newSec.orderIndex,
              component_version: newSec.componentVersion,
              content: {
                title: newSec.title,
                subtitle: newSec.subtitle,
                items: newSec.items
              }
            });

          changedFields = ["sections.added"];
        }
      } else if (classification.intent === "DELETE_SECTION" && classification.targetSectionId) {
        await supabase
          .from("sections")
          .delete()
          .eq("id", classification.targetSectionId);

        changedFields = ["sections.deleted"];
      }

      await job.updateProgress(70);

      // 4. Query current version number count to increment history
      const { count } = await supabase
        .from("website_versions")
        .select("*", { count: "exact", head: true })
        .eq("website_id", websiteId);

      const nextVersionNumber = (count || 0) + 1;

      // Re-query full database layout representing updated layout states
      const { data: updatedPages } = await supabase
        .from("pages")
        .select(`
          id, slug, title,
          sections ( id, type, order_index, component_version, content, styles_override )
        `)
        .eq("website_id", websiteId);

      // Record snapshot with diff parameters
      const { data: newVersion } = await supabase
        .from("website_versions")
        .insert({
          website_id: websiteId,
          version_number: nextVersionNumber,
          pages_snapshot: { pages: updatedPages },
          change_summary: `AI Edit: "${instruction}" (Intent: ${classification.intent})`
        })
        .select()
        .single();

      if (newVersion) {
        await supabase
          .from("websites")
          .update({ active_version_id: newVersion.id })
          .eq("id", websiteId);
      }

      await job.updateProgress(100);
      console.log(`[Worker] Finished AI Edit successfully for Website ID: ${websiteId}`);
      return { status: "completed", websiteId, changedFields };
    } catch (e: any) {
      console.error(`[Worker] Error running AI Edit job:`, e);
      throw e;
    }
  },
  {
    connection: redisConnection as any,
    concurrency: 2
  }
);
