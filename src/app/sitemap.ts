import type { MetadataRoute } from "next";

import { getArticles, getProjects } from "@/lib/cms/queries";
import { getSiteUrl } from "@/lib/seo";

// Projects and articles come from the CMS, so the sitemap is built per request.
export const dynamic = "force-dynamic";

type Entry = MetadataRoute.Sitemap[number];

/**
 * Indexable pages only. The privacy page stays crawlable (linked from the
 * footer) but is left out as it is not a page anyone searches for; /admin and
 * /api are excluded here and disallowed in robots.ts.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, articles, base] = await Promise.all([getProjects(), getArticles(), getSiteUrl()]);

  const latest = (dates: string[]) => {
    const newest = dates.filter(Boolean).sort().at(-1);
    return newest ? new Date(newest) : undefined;
  };
  const projectsUpdated = latest(projects.map((project) => project.updatedAt));
  const articlesUpdated = latest(articles.map((article) => article.updatedAt));
  const siteUpdated = latest([...projects, ...articles].map((row) => row.updatedAt));

  // Every page exists in both languages at ?lang=… (see src/middleware.ts);
  // the bare URL is the x-default.
  const entry = (path: string, fields: Omit<Entry, "url" | "alternates">): Entry => {
    const url = `${base}${path}`;
    return {
      url,
      ...fields,
      alternates: { languages: { en: `${url}?lang=en`, ar: `${url}?lang=ar`, "x-default": url } },
    };
  };

  // lastModified is only given where the CMS knows it, never "now".
  return [
    entry("/", { priority: 1, changeFrequency: "weekly", lastModified: siteUpdated }),
    entry("/about", { priority: 0.9, changeFrequency: "monthly" }),
    entry("/projects", { priority: 0.8, changeFrequency: "weekly", lastModified: projectsUpdated }),
    entry("/articles", { priority: 0.8, changeFrequency: "weekly", lastModified: articlesUpdated }),
    entry("/services", { priority: 0.7, changeFrequency: "monthly" }),
    entry("/clients", { priority: 0.6, changeFrequency: "monthly" }),
    entry("/contact", { priority: 0.6, changeFrequency: "yearly" }),
    ...projects.map((project) =>
      entry(`/projects/${project.slug}`, {
        priority: 0.7,
        changeFrequency: "monthly",
        lastModified: new Date(project.updatedAt),
      }),
    ),
    ...articles.map((article) =>
      entry(`/articles/${article.slug}`, {
        priority: 0.7,
        changeFrequency: "monthly",
        lastModified: new Date(article.updatedAt),
      }),
    ),
  ];
}
