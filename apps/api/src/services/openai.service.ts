import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || "";

export class OpenAIService {
  /**
   * Generates a complete website layout based on business details and a template model using Gemini 1.5 Flash.
   */
  static async generateWebsiteLayout(business: any, template: any) {
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is missing. Utilizing mock fallback generation.");
      return this.getMockGeneratedLayout(business, template);
    }

    const systemPrompt = `You are an expert web designer and copywriter.
Generate a professional, high-converting website configuration in JSON format.
The output MUST strictly match the following JSON Schema:
{
  "siteName": "string (The name of the business)",
  "theme": {
    "mode": "light" | "dark",
    "colors": {
      "primary": "hex color",
      "secondary": "hex color",
      "accent": "hex color",
      "background": "hex color",
      "surface": "hex color",
      "text": "hex color",
      "textMuted": "hex color"
    },
    "typography": {
      "headingFont": "string (e.g. Outfit, Lora)",
      "bodyFont": "string (e.g. Inter, Roboto)",
      "baseFontSize": number (between 14 and 18)
    },
    "uiConfig": {
      "borderRadius": "none" | "sm" | "md" | "lg" | "full",
      "buttonStyle": "solid" | "outline" | "ghost"
    }
  },
  "navigation": {
    "header": {
      "showLogo": true,
      "links": [ { "label": "string", "target": "string (e.g. '#features', '#contact')" } ],
      "ctaButton": { "id": "string", "label": "string", "actionType": "scroll", "target": "#contact", "styleVariant": "primary" }
    },
    "footer": {
      "copyrightText": "string",
      "links": [ { "label": "string", "target": "string" } ]
    }
  },
  "pages": [
    {
      "slug": "/",
      "title": "Home",
      "seo": {
        "metaTitle": "string (under 70 chars)",
        "metaDescription": "string (under 160 chars)",
        "keywords": ["string"]
      },
      "sections": [
        {
          "id": "string (unique)",
          "type": "hero" | "features" | "testimonials" | "pricing" | "faq" | "contact" | "about",
          "orderIndex": number,
          "componentVersion": "1.0",
          "title": "string",
          "subtitle": "string (optional)",
          "content": "string (required only for 'about' sections)",
          "items": "array of items (required for 'features', 'testimonials', 'pricing', 'faq' sections)",
          "ctaButtons": "array of buttons (optional)"
        }
      ]
    }
  ]
}

Ensure all texts, headings, features, and FAQ entries are customized to:
Business Name: ${business.name}
Category: ${business.category}
Description: ${business.description}
Operational Address: ${business.address || "Online"}
Phone: ${business.phone || ""}
WhatsApp: ${business.whatsapp || ""}

Base Template Theme colors: ${JSON.stringify(template.theme_config.colors)}`;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\nGenerate the website configuration JSON now.` }]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.7
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API responded with status ${response.status}: ${response.statusText}`);
      }

      const resBody = await response.json();
      const content = resBody.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!content) {
        throw new Error("Empty text candidate from Gemini LLM response.");
      }

      return JSON.parse(content);
    } catch (error) {
      console.error("Gemini API website generation request failed, using local fallback:", error);
      return this.getMockGeneratedLayout(business, template);
    }
  }

  private static getMockGeneratedLayout(business: any, template: any) {
    return {
      siteName: business.name,
      theme: template.theme_config,
      navigation: {
        header: {
          showLogo: true,
          links: [
            { label: "Home", target: "#" },
            { label: "Features", target: "#features" },
            { label: "Contact", target: "#contact" }
          ],
          ctaButton: { id: "nav-cta", label: "Contact Us", actionType: "scroll", target: "#contact" }
        },
        footer: {
          copyrightText: `© 2026 ${business.name}. Powered by Launchpad.`,
          links: [{ label: "Privacy Policy", target: "#" }]
        }
      },
      pages: [
        {
          slug: "/",
          title: "Home",
          seo: {
            metaTitle: `${business.name} | ${business.category}`,
            metaDescription: business.description.slice(0, 150),
            keywords: [business.category.toLowerCase(), "services"]
          },
          sections: [
            {
              id: "hero-1",
              type: "hero",
              orderIndex: 1.0000,
              componentVersion: "1.0",
              title: `Professional ${business.category} in Town`,
              subtitle: business.description,
              ctaButtons: [
                { id: "h-btn-1", label: "Get Started", actionType: "scroll", target: "#contact" }
              ]
            },
            {
              id: "about-1",
              type: "about",
              orderIndex: 2.0000,
              componentVersion: "1.0",
              title: "About Us",
              content: `We specialize in ${business.category}. Our mission is to deliver high-quality, professional, and reliable services to our local community.`
            },
            {
              id: "contact-1",
              type: "contact",
              orderIndex: 3.0000,
              componentVersion: "1.0",
              title: "Book An Appointment",
              subtitle: "Get in touch with us for inquiries and service requests.",
              address: business.address,
              phone: business.phone,
              whatsapp: business.whatsapp,
              showForm: true
            }
          ]
        }
      ]
    };
  }
}
