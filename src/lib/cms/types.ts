/**
 * Content model for the NEDAL ELABID platform.
 *
 * Every visible marketing string lives here (and therefore in the CMS) rather
 * than inside a component, so the dashboard can edit the site without a deploy.
 */

/** A piece of copy that exists in both site languages. */
export type Localized = {
  en: string;
  ar: string;
};

export type Locale = "en" | "ar";

export interface BaseDoc {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project extends BaseDoc {
  name: Localized;
  slug: string;
  clientId: string | null;
  industry: Localized;
  year: string;
  summary: Localized;
  challenge: Localized;
  objective: Localized;
  strategy: Localized;
  creativeDirection: Localized;
  execution: Localized;
  results: Localized;
  serviceIds: string[];
  keyMetrics: { label: Localized; value: string }[];
  coverImage: string;
  gallery: string[];
  videoUrl: string;
  externalUrl: string;
  category: Localized;
  tags: string[];
  featured: boolean;
  pinned: boolean;
  published: boolean;
  publishedAt: string | null;
  order: number;
  seoTitle: Localized;
  seoDescription: Localized;
}

export interface Client extends BaseDoc {
  name: Localized;
  logo: string;
  industry: Localized;
  description: Localized;
  website: string;
  featured: boolean;
  published: boolean;
  order: number;
}

export interface Service extends BaseDoc {
  title: Localized;
  shortDescription: Localized;
  longDescription: Localized;
  icon: string;
  category: Localized;
  /** Per-service CTA shown on the slider card. */
  ctaLabel: Localized;
  ctaUrl: string;
  featured: boolean;
  published: boolean;
  order: number;
}

export interface Skill extends BaseDoc {
  name: Localized;
  category: Localized;
  description: Localized;
  published: boolean;
  order: number;
}

export interface Tool extends BaseDoc {
  name: string;
  category: Localized;
  published: boolean;
  order: number;
}

export interface ExperienceEntry extends BaseDoc {
  company: Localized;
  title: Localized;
  startDate: string;
  endDate: string;
  location: Localized;
  description: Localized;
  achievements: Localized;
  skills: string[];
  logo: string;
  published: boolean;
  order: number;
}

export interface Testimonial extends BaseDoc {
  name: Localized;
  role: Localized;
  company: Localized;
  quote: Localized;
  photo: string;
  projectId: string | null;
  featured: boolean;
  published: boolean;
  order: number;
}

export interface Metric extends BaseDoc {
  label: Localized;
  value: number;
  prefix: string;
  suffix: string;
  description: Localized;
  showInHero: boolean;
  published: boolean;
  order: number;
}

export interface SocialLink extends BaseDoc {
  platform: string;
  label: Localized;
  url: string;
  published: boolean;
  order: number;
}

export interface NavigationItem extends BaseDoc {
  label: Localized;
  href: string;
  published: boolean;
  order: number;
}

export interface MediaAsset extends BaseDoc {
  url: string;
  fileName: string;
  alt: Localized;
  mimeType: string;
  size: number;
}

/** Free-form editable copy blocks (hero, about, section intros...). */
export interface SiteContentBlock extends BaseDoc {
  key: string;
  group: string;
  label: string;
  value: Localized;
  order: number;
}

export interface Article extends BaseDoc {
  title: Localized;
  slug: string;
  summary: Localized;
  /** Long-form body. Plain text with blank lines between paragraphs. */
  content: Localized;
  coverImage: string;
  category: Localized;
  author: string;
  date: string;
  featured: boolean;
  published: boolean;
  order: number;
  seoTitle: Localized;
  seoDescription: Localized;
}

export interface Inquiry extends BaseDoc {
  name: string;
  company: string;
  email: string;
  /** Required on the public form; email is optional. */
  phone: string;
  service: string;
  budget: string;
  brief: string;
  handled: boolean;
}

export interface SiteSettings extends BaseDoc {
  siteTitle: Localized;
  siteDescription: Localized;
  keywords: string;
  ogImage: string;
  favicon: string;
  defaultLocale: Locale;
  email: string;
  whatsapp: string;
  accentFrom: string;
  accentTo: string;
  /** 0-100: how loud the decorative HUD/grain/glow layers are. */
  visualIntensity: number;
  heroImage: string;
  heroRevealImage: string;
  aboutImage: string;
  sections: Record<string, boolean>;
}

export interface AdminUser extends BaseDoc {
  email: string;
  name: string;
  role: "admin";
}

export type CollectionMap = {
  projects: Project;
  articles: Article;
  clients: Client;
  services: Service;
  skills: Skill;
  tools: Tool;
  experience: ExperienceEntry;
  testimonials: Testimonial;
  metrics: Metric;
  social_links: SocialLink;
  navigation_items: NavigationItem;
  media_assets: MediaAsset;
  site_content: SiteContentBlock;
  inquiries: Inquiry;
  site_settings: SiteSettings;
  admins: AdminUser;
};

export type CollectionName = keyof CollectionMap;

export const COLLECTION_NAMES = [
  "projects",
  "articles",
  "clients",
  "services",
  "skills",
  "tools",
  "experience",
  "testimonials",
  "metrics",
  "social_links",
  "navigation_items",
  "media_assets",
  "site_content",
  "inquiries",
  "site_settings",
  "admins",
] as const satisfies readonly CollectionName[];

/** Shape stored/accepted by adapters: everything but the generated fields. */
export type NewDoc<K extends CollectionName> = Omit<CollectionMap[K], keyof BaseDoc>;
export type DocPatch<K extends CollectionName> = Partial<NewDoc<K>>;
