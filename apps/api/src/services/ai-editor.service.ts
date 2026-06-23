import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || "";

export interface EditClassification {
  intent: "THEME_EDIT" | "SECTION_EDIT" | "ADD_SECTION" | "DELETE_SECTION" | "PAGE_EDIT" | "SEO_EDIT";
  targetPageSlug: string;
  targetSectionId?: string;
  reasoning: string;
}

export class AIEditorService {
  private static endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  /**
   * 1. INTENT & TARGET CLASSIFICATION
   * Resolves what to update, on which page, and which section ID using Gemini.
   */
  static async classifyInstruction(instruction: string, siteStructure: any): Promise<EditClassification> {
    if (!apiKey) {
      return {
        intent: "SECTION_EDIT",
        targetPageSlug: "/",
        targetSectionId: siteStructure.pages?.[0]?.sections?.[0]?.id || "hero-section-1",
        reasoning: "Mock: Defaulting to first section editing."
      };
    }

    const systemPrompt = `You are an AI system controller.
Analyze the user's natural language website editing instruction and classify it.
Current Website Structure: ${JSON.stringify(siteStructure)}

Determine:
1. Intent:
   - "THEME_EDIT" (modifies general colors, fonts, margins)
   - "SECTION_EDIT" (modifies copy, titles, images, or items in an existing section)
   - "ADD_SECTION" (adds a new section, e.g. "add contact details" or "add pricing card")
   - "DELETE_SECTION" (removes a section)
   - "PAGE_EDIT" (creates a new subpage, e.g. "create about us page")
   - "SEO_EDIT" (modifies meta tags or title keywords)
2. Target Page Slug (e.g. "/" or "/about")
3. Target Section ID (if intent is SECTION_EDIT or DELETE_SECTION)

Return ONLY a JSON object matching this schema:
{
  "intent": "THEME_EDIT" | "SECTION_EDIT" | "ADD_SECTION" | "DELETE_SECTION" | "PAGE_EDIT" | "SEO_EDIT",
  "targetPageSlug": "string",
  "targetSectionId": "string (optional)",
  "reasoning": "string"
}`;

    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\nClassify instruction: "${instruction}"` }]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1
          }
        })
      });

      if (!response.ok) throw new Error("Gemini API classification error");
      const resBody = await response.json();
      const content = resBody.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!content) throw new Error("Empty candidate text returned.");
      return JSON.parse(content) as EditClassification;
    } catch (e) {
      console.error("Classification request failed. Using mock default edit.", e);
      return {
        intent: "SECTION_EDIT",
        targetPageSlug: "/",
        targetSectionId: siteStructure.pages?.[0]?.sections?.[0]?.id || "hero-section-1",
        reasoning: "Fallback connection error."
      };
    }
  }

  /**
   * 2. SECTION CONTENT EDITING
   * Sends ONLY the targeted section JSON to minimize token cost using Gemini.
   */
  static async editSectionContent(section: any, instruction: string): Promise<any> {
    if (!apiKey) {
      return {
        ...section,
        content: {
          ...section.content,
          title: "AI Updated Title",
          subtitle: `Modified via instruction: ${instruction}`
        }
      };
    }

    const systemPrompt = `You are a copywriter and web designer.
You are editing an individual website section.
Current Section JSON: ${JSON.stringify(section)}
Instruction: "${instruction}"

Modify the text copy, CTA button details, lists, or styles overrides to satisfy the instruction.
Maintain the exact JSON structure of the section content properties.
Do not modify the "id" or "type" parameters.

Return ONLY the updated section JSON object (conforming to the schema).`;

    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\nApply edits and return the updated JSON now.` }]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.5
          }
        })
      });

      if (!response.ok) throw new Error("Gemini edit section error");
      const resBody = await response.json();
      const content = resBody.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!content) throw new Error("Empty candidate text returned.");
      return JSON.parse(content);
    } catch (e) {
      console.error("Section editing failed, using fallback:", e);
      return {
        ...section,
        content: {
          ...section.content,
          subtitle: `Error applying edit: "${instruction}"`
        }
      };
    }
  }

  /**
   * 3. THEME EDITING
   * Modifies color variables, rounded borders, or typography tags using Gemini.
   */
  static async editThemeConfig(theme: any, instruction: string): Promise<any> {
    if (!apiKey) {
      return {
        ...theme,
        colors: {
          ...theme.colors,
          primary: "#D4AF37",
          background: "#121212"
        }
      };
    }

    const systemPrompt = `You are a visual UI designer.
You are modifying a website theme configuration.
Current Theme Config: ${JSON.stringify(theme)}
Instruction: "${instruction}"

Modify colors, typography, or UI configurations (border-radius, button-style) to satisfy the instruction.
Ensure all colors are valid HEX values.
Maintain the exact theme JSON schema.

Return ONLY the updated theme config JSON object.`;

    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\nApply theme adjustments now.` }]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.3
          }
        })
      });

      if (!response.ok) throw new Error("Gemini edit theme error");
      const resBody = await response.json();
      const content = resBody.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!content) throw new Error("Empty candidate text returned.");
      return JSON.parse(content);
    } catch (e) {
      console.error("Theme editing failed:", e);
      return theme;
    }
  }
}
