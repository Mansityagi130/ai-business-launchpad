import { Hero } from "./sections/Hero";
import { About } from "./sections/About";
import { Features } from "./sections/Features";
import { Testimonials } from "./sections/Testimonials";
import { Pricing } from "./sections/Pricing";
import { FAQ } from "./sections/FAQ";
import { Contact } from "./sections/Contact";
import { CTA } from "./sections/CTA";

export const ComponentRegistry: Record<string, React.FC<any>> = {
  hero: Hero,
  about: About,
  features: Features,
  testimonials: Testimonials,
  pricing: Pricing,
  faq: FAQ,
  contact: Contact,
  cta: CTA,
};
