import { z } from "zod";

// Theme Color and Typography Tokens
export const ThemeSchema = z.object({
  mode: z.enum(["light", "dark"]),
  colors: z.object({
    primary: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
    secondary: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
    accent: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
    background: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
    surface: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
    text: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
    textMuted: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
  }),
  typography: z.object({
    headingFont: z.string().min(1),
    bodyFont: z.string().min(1),
    baseFontSize: z.number().min(10).max(24).default(16),
  }),
  uiConfig: z.object({
    borderRadius: z.enum(["none", "sm", "md", "lg", "full"]).default("md"),
    buttonStyle: z.enum(["solid", "outline", "ghost"]).default("solid"),
  })
});

// Component Primitives
export const ButtonComponentSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  actionType: z.enum(["link", "whatsapp", "email", "scroll"]),
  target: z.string().min(1),
  styleVariant: z.enum(["primary", "secondary", "outline"]).default("primary")
});

export const ImageComponentSchema = z.object({
  id: z.string().min(1),
  url: z.string().url(),
  alt: z.string().optional(),
  caption: z.string().optional()
});

// Section Specifications
export const HeroSectionSchema = z.object({
  type: z.literal("hero"),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  image: ImageComponentSchema.optional(),
  ctaButtons: z.array(ButtonComponentSchema).max(2).optional()
});

export const FeaturesSectionSchema = z.object({
  type: z.literal("features"),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  items: z.array(z.object({
    id: z.string().min(1),
    icon: z.string().optional(),
    title: z.string().min(1),
    description: z.string().min(1)
  })).min(1).max(12)
});

export const TestimonialsSectionSchema = z.object({
  type: z.literal("testimonials"),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  items: z.array(z.object({
    id: z.string().min(1),
    author: z.string().min(1),
    role: z.string().optional(),
    avatarUrl: z.string().url().optional(),
    quote: z.string().min(1)
  })).min(1).max(6)
});

export const PricingSectionSchema = z.object({
  type: z.literal("pricing"),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  tiers: z.array(z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    price: z.string().min(1),
    period: z.string().default("month"),
    features: z.array(z.string()),
    ctaButton: ButtonComponentSchema.optional(),
    isPopular: z.boolean().default(false)
  })).min(1).max(4)
});

export const FAQSectionSchema = z.object({
  type: z.literal("faq"),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  items: z.array(z.object({
    id: z.string().min(1),
    question: z.string().min(1),
    answer: z.string().min(1)
  })).min(1).max(10)
});

export const ContactSectionSchema = z.object({
  type: z.literal("contact"),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email().optional(),
  businessHours: z.record(z.string()).optional(),
  showForm: z.boolean().default(true)
});

export const AboutSectionSchema = z.object({
  type: z.literal("about"),
  title: z.string().min(1),
  content: z.string().min(1),
  image: ImageComponentSchema.optional()
});

// Section Wrapper
export const SectionSchema = z.object({
  id: z.string().min(1),
  orderIndex: z.number(),
  componentVersion: z.string().regex(/^\d+\.\d+$/),
  stylesOverride: z.object({
    paddingY: z.enum(["none", "sm", "md", "lg"]).default("md"),
    backgroundColor: z.string().optional(),
    textColor: z.string().optional()
  }).optional()
}).and(z.discriminatedUnion("type", [
  HeroSectionSchema,
  FeaturesSectionSchema,
  TestimonialsSectionSchema,
  PricingSectionSchema,
  FAQSectionSchema,
  ContactSectionSchema,
  AboutSectionSchema
]));

// Navigation
export const NavItemSchema = z.object({
  label: z.string().min(1),
  target: z.string().min(1),
  isOpenInNewTab: z.boolean().default(false)
});

export const NavigationSchema = z.object({
  header: z.object({
    showLogo: z.boolean().default(true),
    links: z.array(NavItemSchema).max(8),
    ctaButton: ButtonComponentSchema.optional()
  }),
  footer: z.object({
    copyrightText: z.string(),
    links: z.array(NavItemSchema).max(8),
    socials: z.object({
      facebook: z.string().url().optional(),
      instagram: z.string().url().optional(),
      twitter: z.string().url().optional(),
      whatsapp: z.string().optional()
    }).optional()
  })
});

// SEO
export const SEOSchema = z.object({
  metaTitle: z.string().max(70),
  metaDescription: z.string().max(160),
  ogImage: z.string().url().optional(),
  keywords: z.array(z.string()).default([])
});

// Page
export const PageSchema = z.object({
  slug: z.string().regex(/^\/([a-z0-9-]*)*$/),
  title: z.string().min(1),
  seo: SEOSchema,
  sections: z.array(SectionSchema)
});

// Root Website Schema
export const WebsiteSchema = z.object({
  id: z.string().uuid(),
  siteName: z.string().min(1),
  logoUrl: z.string().url().optional(),
  theme: ThemeSchema,
  navigation: NavigationSchema,
  pages: z.array(PageSchema).min(1)
});

export type Website = z.infer<typeof WebsiteSchema>;
export type Section = z.infer<typeof SectionSchema>;
export type Page = z.infer<typeof PageSchema>;
export type Theme = z.infer<typeof ThemeSchema>;
export type Navigation = z.infer<typeof NavigationSchema>;
export type SEO = z.infer<typeof SEOSchema>;
