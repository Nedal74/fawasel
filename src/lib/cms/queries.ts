import "server-only";

import { cache } from "react";

import { LEGACY_COPY, LEGACY_SERVICE_CATEGORY, seedData } from "./defaults";
import { getStore } from "./store";
import type {
  Article,
  ChatbotConfig,
  ChatKnowledge,
  Client,
  CollectionMap,
  CollectionName,
  ExperienceEntry,
  Metric,
  NavigationItem,
  Project,
  Service,
  SiteContentBlock,
  SiteSettings,
  Skill,
  SocialLink,
  Testimonial,
  Tool,
} from "./types";

type Ordered = { order?: number; createdAt: string };

function byOrder<T extends Ordered>(rows: T[]): T[] {
  return [...rows].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0) || a.createdAt.localeCompare(b.createdAt),
  );
}

const listAll = cache(async <K extends CollectionName>(collection: K) => {
  const store = await getStore();
  return store.list(collection);
});

/** Every read used by public pages funnels through here. */
export const listCollection = async <K extends CollectionName>(
  collection: K,
): Promise<CollectionMap[K][]> => listAll(collection);

function publishedOnly<T extends { published?: boolean }>(rows: T[]): T[] {
  return rows.filter((row) => row.published !== false);
}

/** Accents shipped before the V2 black/white/lime system. */
const LEGACY_ACCENTS = new Set(["#c81e18", "#ff7a18"]);

export const getSettings = cache(async (): Promise<SiteSettings> => {
  const seed = seedData().site_settings[0] as SiteSettings;
  const stored = (await listAll("site_settings"))[0];
  if (!stored) return seed;

  // Merge so fields added after a site was seeded (new section toggles, new
  // image slots) are present, and retire the pre-V2 red/orange accent.
  const accentFrom = LEGACY_ACCENTS.has(stored.accentFrom?.toLowerCase())
    ? seed.accentFrom
    : stored.accentFrom || seed.accentFrom;
  const accentTo = LEGACY_ACCENTS.has(stored.accentTo?.toLowerCase())
    ? seed.accentTo
    : stored.accentTo || seed.accentTo;

  return {
    ...seed,
    ...stored,
    accentFrom,
    accentTo,
    sections: { ...seed.sections, ...(stored.sections ?? {}) },
  };
});

export const getContentMap = cache(async (): Promise<Record<string, SiteContentBlock>> => {
  const map: Record<string, SiteContentBlock> = {};
  // Seed first so copy keys added in a later version still render; stored
  // blocks then override them.
  const seeded = seedData().site_content;
  for (const block of seeded) map[block.key] = block;

  for (const row of await listAll("site_content")) {
    const legacy = LEGACY_COPY[row.key];
    const untouched =
      legacy && row.value.en === legacy.en && row.value.ar === legacy.ar && map[row.key];
    // An untouched V1 default keeps following the seed through the rename.
    if (!untouched) map[row.key] = row;
  }
  return map;
});

export const getProjects = cache(async (): Promise<Project[]> => {
  const rows = publishedOnly(await listAll("projects"));
  return byOrder(rows).sort((a, b) => Number(b.pinned) - Number(a.pinned));
});

export const getFeaturedProjects = cache(async (): Promise<Project[]> => {
  const projects = await getProjects();
  const featured = projects.filter((p) => p.featured);
  return (featured.length > 0 ? featured : projects).slice(0, 6);
});

export const getProjectBySlug = cache(async (slug: string): Promise<Project | null> => {
  const rows = await listAll("projects");
  return rows.find((p) => p.slug === slug && p.published) ?? null;
});

export const getArticles = cache(async (): Promise<Article[]> => {
  const rows = publishedOnly(await listAll("articles"));
  return [...rows].sort(
    (a, b) =>
      (a.order ?? 0) - (b.order ?? 0) ||
      (b.date ?? "").localeCompare(a.date ?? "") ||
      b.createdAt.localeCompare(a.createdAt),
  );
});

export const getFeaturedArticles = cache(async (): Promise<Article[]> => {
  const articles = await getArticles();
  const featured = articles.filter((article) => article.featured);
  return (featured.length > 0 ? featured : articles).slice(0, 3);
});

export const getArticleBySlug = cache(async (slug: string): Promise<Article | null> => {
  const rows = await listAll("articles");
  return rows.find((article) => article.slug === slug && article.published) ?? null;
});

export const getServices = cache(async (): Promise<Service[]> => {
  const seeded = new Map(seedData().services.map((service) => [service.id, service]));

  // V2 split the single "Marketing" category into two, which the About pills
  // group by. A service still carrying the old default follows the split; an
  // edited category is left alone.
  return byOrder(publishedOnly(await listAll("services"))).map((service) => {
    const untouched =
      service.category?.en === LEGACY_SERVICE_CATEGORY.en &&
      service.category?.ar === LEGACY_SERVICE_CATEGORY.ar;
    const seed = seeded.get(service.id);
    return untouched && seed ? { ...service, category: seed.category } : service;
  });
});

export const getSkills = cache(async (): Promise<Skill[]> =>
  byOrder(publishedOnly(await listAll("skills"))),
);

export const getTools = cache(async (): Promise<Tool[]> =>
  byOrder(publishedOnly(await listAll("tools"))),
);

export const getClients = cache(async (): Promise<Client[]> =>
  byOrder(publishedOnly(await listAll("clients"))),
);

export const getExperience = cache(async (): Promise<ExperienceEntry[]> =>
  byOrder(publishedOnly(await listAll("experience"))),
);

export const getTestimonials = cache(async (): Promise<Testimonial[]> =>
  byOrder(publishedOnly(await listAll("testimonials"))),
);

export const getMetrics = cache(async (): Promise<Metric[]> =>
  byOrder(publishedOnly(await listAll("metrics"))),
);

export const getSocialLinks = cache(async (): Promise<SocialLink[]> =>
  byOrder(publishedOnly(await listAll("social_links"))),
);

export const getNavigation = cache(async (): Promise<NavigationItem[]> =>
  byOrder(publishedOnly(await listAll("navigation_items"))),
);

/** The chatbot config, merged over the defaults so new fields always exist. */
export const getChatbot = cache(async (): Promise<ChatbotConfig> => {
  const seed = seedData().chatbot[0] as ChatbotConfig;
  const stored = (await listAll("chatbot").catch(() => []))[0];
  if (!stored) return seed;
  const merged = { ...seed, ...stored };
  if (!Array.isArray(merged.steps) || merged.steps.length === 0) merged.steps = seed.steps;
  if (!Array.isArray(merged.synonyms)) merged.synonyms = seed.synonyms;
  return merged;
});

/**
 * Published knowledge-base entries. Falls back to the starter entries only
 * when the table cannot be read (e.g. the SQL update has not been run yet).
 */
export const getKnowledge = cache(async (): Promise<ChatKnowledge[]> => {
  try {
    const rows = await listAll("chat_knowledge");
    return byOrder(publishedOnly(rows));
  } catch {
    return seedData().chat_knowledge;
  }
});
