import "server-only";

import type { Metadata } from "next";
import { cache } from "react";

import {
  getArticleBySlug,
  getContentMap,
  getNavigation,
  getProjectBySlug,
  getSettings,
} from "@/lib/cms/queries";
import type { Article, Locale, Project } from "@/lib/cms/types";
import { getLocale, pick } from "@/lib/i18n";
import { absoluteUrl, currentPath, getSiteUrl, languageUrl } from "@/lib/seo";

/**
 * One description of "what this page is", shared by every page's metadata
 * and by the site-wide JSON-LD graph (src/lib/structured-data.ts), so titles,
 * descriptions, images and breadcrumbs never drift apart.
 */

export type PageKind =
  | "home"
  | "about"
  | "services"
  | "projects"
  | "project"
  | "articles"
  | "article"
  | "clients"
  | "contact"
  | "privacy";

export type PageSeo = {
  kind: PageKind;
  path: string;
  /** Page title without the brand suffix (the layout template adds it). */
  title: string;
  description: string;
  image: string;
  breadcrumb: { name: string; path: string }[];
  article?: Article;
  project?: Project;
};

/** "NEDAL ELABID" → "Nedal Elabid"; mixed-case or Arabic text is untouched. */
export function readableCase(value: string): string {
  if (!/[A-Z]/.test(value) || /[a-z]/.test(value) || !/^[\x20-\x7E]+$/.test(value)) return value;
  return value.toLowerCase().replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
}

/** Section listing pages and the CMS copy keys that title them. */
const SECTIONS: Record<string, { kind: PageKind; copy: string }> = {
  "/about": { kind: "about", copy: "about" },
  "/services": { kind: "services", copy: "services" },
  "/projects": { kind: "projects", copy: "work" },
  "/articles": { kind: "articles", copy: "articles" },
  "/clients": { kind: "clients", copy: "clients" },
  "/contact": { kind: "contact", copy: "contact" },
  "/privacy": { kind: "privacy", copy: "privacy" },
};

export const resolvePageSeo = cache(async (path: string, locale: Locale): Promise<PageSeo | null> => {
  const [content, settings, navigation] = await Promise.all([
    getContentMap(),
    getSettings(),
    getNavigation(),
  ]);
  const copy = (key: string) => pick(content[key]?.value, locale);
  const navLabel = (href: string) => {
    const item = navigation.find((row) => row.href === href);
    return item ? pick(item.label, locale) : "";
  };
  const home = { name: navLabel("/") || readableCase(copy("hero.name")), path: "/" };
  const sectionCrumb = (href: string, fallback: string) => ({
    name: navLabel(href) || readableCase(fallback),
    path: href,
  });

  if (path === "/") {
    return {
      kind: "home",
      path,
      title: pick(settings.siteTitle, locale),
      description: pick(settings.siteDescription, locale),
      image: settings.ogImage,
      breadcrumb: [],
    };
  }

  const section = SECTIONS[path];
  if (section) {
    const title = readableCase(copy(`${section.copy}.heading`));
    // About reads best with the person's own lead; the rest use their intro.
    const description = copy(section.kind === "about" ? "about.lead" : `${section.copy}.intro`);
    return {
      kind: section.kind,
      path,
      title,
      description: description || pick(settings.siteDescription, locale),
      image: section.kind === "about" ? settings.aboutImage || settings.ogImage : settings.ogImage,
      breadcrumb: [home, sectionCrumb(path, title)],
    };
  }

  const project = path.match(/^\/projects\/([^/]+)$/);
  if (project) {
    const row = await getProjectBySlug(decodeURIComponent(project[1]));
    if (!row) return null;
    const title = pick(row.seoTitle, locale) || pick(row.name, locale);
    return {
      kind: "project",
      path,
      title,
      description: pick(row.seoDescription, locale) || pick(row.summary, locale),
      image: row.coverImage || settings.ogImage,
      breadcrumb: [home, sectionCrumb("/projects", copy("work.heading")), { name: pick(row.name, locale), path }],
      project: row,
    };
  }

  const article = path.match(/^\/articles\/([^/]+)$/);
  if (article) {
    const row = await getArticleBySlug(decodeURIComponent(article[1]));
    if (!row) return null;
    const title = pick(row.seoTitle, locale) || pick(row.title, locale);
    return {
      kind: "article",
      path,
      title,
      description: pick(row.seoDescription, locale) || pick(row.summary, locale),
      image: row.coverImage || settings.ogImage,
      breadcrumb: [home, sectionCrumb("/articles", copy("articles.heading")), { name: pick(row.title, locale), path }],
      article: row,
    };
  }

  return null;
});

/** The canonical URL of the current request (keeps an explicit ?lang=). */
export async function canonicalUrl(path: string, locale: Locale): Promise<string> {
  const [base, { explicitLocale }] = await Promise.all([getSiteUrl(), currentPath()]);
  return `${base}${explicitLocale ? languageUrl(path, locale) : path}`;
}

/** Brand shown after page titles: the person's name in the page language. */
export async function brandName(locale: Locale): Promise<string> {
  const content = await getContentMap();
  return readableCase(pick(content["hero.name"]?.value, locale));
}

/**
 * Metadata for one public page: title, description, Open Graph and Twitter
 * card, all agreeing with each other and with the canonical URL. The root
 * layout supplies canonical/hreflang, robots and the title template.
 */
export async function pageMetadata(path: string): Promise<Metadata> {
  const locale = await getLocale();
  const seo = await resolvePageSeo(path, locale);
  if (!seo) return { title: "404", robots: { index: false, follow: true } };

  const [base, url, brand] = await Promise.all([getSiteUrl(), canonicalUrl(path, locale), brandName(locale)]);
  const socialTitle = seo.kind === "home" ? seo.title : `${seo.title} — ${brand}`;
  const image = absoluteUrl(base, seo.image);
  const images = image ? [{ url: image, alt: socialTitle }] : undefined;

  const openGraph: NonNullable<Metadata["openGraph"]> =
    seo.kind === "article" && seo.article
      ? {
          type: "article",
          publishedTime: seo.article.date || seo.article.createdAt,
          modifiedTime: seo.article.updatedAt,
          authors: [`${base}/about`],
          section: pick(seo.article.category, locale) || undefined,
        }
      : seo.kind === "home" || seo.kind === "about"
        ? { type: "profile" }
        : { type: "website" };

  return {
    title: seo.kind === "home" ? { absolute: seo.title } : seo.title,
    description: seo.description,
    openGraph: {
      ...openGraph,
      title: socialTitle,
      description: seo.description,
      url,
      siteName: brand,
      locale: locale === "ar" ? "ar_SA" : "en_US",
      alternateLocale: locale === "ar" ? "en_US" : "ar_SA",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: seo.description,
      images: image ? [image] : undefined,
    },
  };
}
