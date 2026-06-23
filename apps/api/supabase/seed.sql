-- Seed Feature Flags
insert into public.feature_flags (key, name, description, is_enabled, rollout_percentage, target_plans)
values 
('ai-logo-generation', 'AI Logo Creator', 'Generate branding logos dynamically from prompts', true, 100, '{free, pro, enterprise}'),
('whatsapp-catalog-sync', 'WhatsApp Inventory Sync', 'Sync services inventory catalog to whatsapp numbers', false, 0, '{pro, enterprise}');

-- Seed Website Templates
insert into public.website_templates (name, description, category, theme_config, pages_layout, thumbnail_url)
values (
  'Consulting Minimalist',
  'A sleek, professional dark layout optimized for advisors and boutique agencies.',
  'Consulting & Professional Services',
  '{
    "mode": "dark",
    "colors": {
      "primary": "#3B82F6",
      "secondary": "#1E293B",
      "accent": "#F59E0B",
      "background": "#0F172A",
      "surface": "#1E293B",
      "text": "#F8FAFC",
      "textMuted": "#94A3B8"
    },
    "typography": {
      "headingFont": "Outfit",
      "bodyFont": "Inter",
      "baseFontSize": 16
    },
    "uiConfig": {
      "borderRadius": "md",
      "buttonStyle": "solid"
    }
  }'::jsonb,
  '{
    "pages": [
      {
        "slug": "/",
        "title": "Home",
        "sections": [
          {
            "id": "temp-hero",
            "type": "hero",
            "orderIndex": 1.0000,
            "componentVersion": "1.0",
            "title": "Expert Advisory Services",
            "subtitle": "Growing your online strategy with precision."
          }
        ]
      }
    ]
  }'::jsonb,
  'https://supabase-cdn/templates/consulting-thumb.png'
),
(
  'Local Food Bakery',
  'A warm, inviting layout optimized for bakers, cafes, and local restaurants.',
  'Food & Beverage',
  '{
    "mode": "light",
    "colors": {
      "primary": "#D97706",
      "secondary": "#FEF3C7",
      "accent": "#EF4444",
      "background": "#FFFBEB",
      "surface": "#FFFFFF",
      "text": "#78350F",
      "textMuted": "#B45309"
    },
    "typography": {
      "headingFont": "Lora",
      "bodyFont": "Inter",
      "baseFontSize": 16
    },
    "uiConfig": {
      "borderRadius": "full",
      "buttonStyle": "solid"
    }
  }'::jsonb,
  '{
    "pages": [
      {
        "slug": "/",
        "title": "Home",
        "sections": [
          {
            "id": "temp-hero-bakery",
            "type": "hero",
            "orderIndex": 1.0000,
            "componentVersion": "1.0",
            "title": "Freshly Baked Every Morning",
            "subtitle": "Artisanal breads and cakes made with organic ingredients."
          }
        ]
      }
    ]
  }'::jsonb,
  'https://supabase-cdn/templates/bakery-thumb.png'
);
