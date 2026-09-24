import type { MetadataRoute } from "next";

import { getArticles, getProjects } from "@/lib/cms/queries";

// Projects come from the CMS, so the sitemap is generated per request.
export const dynamic = "force-dynamic";

const BASE = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, articles] = await Promise.all([getProjects(), getArticles()]);
  const staticRoutes = [
    "",
    "/about",
    "/services",
    "/projects",
    "/articles",
    "/clients",
    "/contact",
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: `${BASE}${route || "/"}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: route === "" ? 1 : 0.7,
    })),
    ...projects.map((project) => ({
      url: `${BASE}/projects/${project.slug}`,
      lastModified: new Date(project.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...articles.map((article) => ({
      url: `${BASE}/articles/${article.slug}`,
      lastModified: new Date(article.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
