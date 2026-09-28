import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/seo";

// Built per request so the sitemap URL is absolute even without
// NEXT_PUBLIC_SITE_URL.
export const dynamic = "force-dynamic";

/**
 * Everything public is crawlable (home, about, projects, articles, …). The
 * dashboard and API routes are not: /admin also sends noindex itself.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = await getSiteUrl();
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
