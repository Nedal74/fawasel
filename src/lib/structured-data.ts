import "server-only";

import {
  getClients,
  getContentMap,
  getServices,
  getSettings,
  getSocialLinks,
} from "@/lib/cms/queries";
import type { Locale } from "@/lib/cms/types";
import { pick } from "@/lib/locale";
import { absoluteUrl, getSiteUrl } from "@/lib/seo";
import { canonicalUrl, readableCase, resolvePageSeo, type PageSeo } from "@/lib/seo-pages";

/**
 * The site's entire schema.org graph, built in one place and injected once by
 * the public layout. Every node has a stable @id so the Person, the WebSite
 * and each page reference each other instead of repeating themselves:
 *
 *   #person  ← WebSite.publisher, WebPage.about, Article.author, CreativeWork.creator
 *   #website ← WebPage.isPartOf
 *
 * Everything comes from the CMS at render time (names, role, photo, address,
 * services, social profiles), so the dashboard stays the single source.
 *
 * No #organization node: the content describes one person (clients are
 * clients, not an employer), so no worksFor/founder relation is claimed.
 */

type Node = Record<string, unknown>;

/** Social links that are profiles of the person (not chat or mail links). */
function isProfileUrl(url: string): boolean {
  return /^https?:\/\//i.test(url) && !/(wa\.me|whatsapp\.com|mailto:|tel:)/i.test(url);
}

/** Drops undefined/empty values so the JSON stays clean and valid. */
function compact<T extends Node>(node: T): T {
  return Object.fromEntries(
    Object.entries(node).filter(
      ([, value]) => value !== undefined && value !== "" && !(Array.isArray(value) && value.length === 0),
    ),
  ) as T;
}

export async function buildStructuredData(path: string, locale: Locale): Promise<Node | null> {
  const [seo, settings, content, socials, services, base] = await Promise.all([
    resolvePageSeo(path, locale),
    getSettings(),
    getContentMap(),
    getSocialLinks(),
    getServices(),
    getSiteUrl(),
  ]);
  if (!seo) return null;

  const ids = {
    person: `${base}/#person`,
    website: `${base}/#website`,
  };
  const other: Locale = locale === "ar" ? "en" : "ar";
  const name = readableCase(pick(content["hero.name"]?.value, locale));
  const otherName = readableCase(content["hero.name"]?.value[other] ?? "");
  const siteTitle = pick(settings.siteTitle, locale);

  const person = compact({
    "@type": "Person",
    "@id": ids.person,
    name,
    alternateName: otherName && otherName !== name ? [otherName] : undefined,
    url: `${base}/`,
    image: absoluteUrl(base, settings.heroImage) || undefined,
    jobTitle: readableCase(pick(content["hero.title"]?.value, locale)),
    description: pick(settings.siteDescription, locale),
    email: settings.email ? `mailto:${settings.email}` : undefined,
    address:
      pick(settings.addressLocality, locale) || settings.addressCountry
        ? compact({
            "@type": "PostalAddress",
            addressLocality: pick(settings.addressLocality, locale),
            addressCountry: settings.addressCountry,
          })
        : undefined,
    knowsAbout: [...new Set(services.map((service) => pick(service.title, locale)).filter(Boolean))].slice(0, 16),
    knowsLanguage: ["ar", "en"],
    sameAs: [...new Set(socials.map((social) => social.url.trim()).filter(isProfileUrl))],
  });

  const website = compact({
    "@type": "WebSite",
    "@id": ids.website,
    url: `${base}/`,
    name,
    alternateName: [siteTitle, otherName].filter((value) => value && value !== name),
    description: pick(settings.siteDescription, locale),
    inLanguage: ["en", "ar"],
    publisher: { "@id": ids.person },
    about: { "@id": ids.person },
  });

  const url = await canonicalUrl(path, locale);
  const pageId = `${url}#webpage`;
  const image = absoluteUrl(base, seo.image);
  const graph: Node[] = [person, website];

  const breadcrumb =
    seo.breadcrumb.length > 1
      ? {
          "@type": "BreadcrumbList",
          "@id": `${url}#breadcrumb`,
          itemListElement: seo.breadcrumb.map((crumb, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: crumb.name,
            item: `${base}${crumb.path === "/" ? "/" : crumb.path}`,
          })),
        }
      : null;

  graph.push(
    compact({
      "@type": pageType(seo),
      "@id": pageId,
      url,
      name: seo.title,
      description: seo.description,
      inLanguage: locale,
      isPartOf: { "@id": ids.website },
      // The About page is the person's profile; the homepage is about them.
      mainEntity: seo.kind === "about" ? { "@id": ids.person } : undefined,
      about: seo.kind === "home" ? { "@id": ids.person } : undefined,
      primaryImageOfPage: image ? { "@type": "ImageObject", url: image } : undefined,
      breadcrumb: breadcrumb ? { "@id": breadcrumb["@id"] } : undefined,
    }),
  );
  if (breadcrumb) graph.push(breadcrumb);

  if (seo.article) {
    const article = seo.article;
    const author = article.author.trim();
    // Only link to the person when the byline is theirs (or empty).
    const byPerson =
      !author ||
      [content["hero.name"]?.value.en, content["hero.name"]?.value.ar]
        .filter(Boolean)
        .some((known) => known!.trim().toLowerCase() === author.toLowerCase());
    graph.push(
      compact({
        "@type": "Article",
        "@id": `${url}#article`,
        headline: pick(article.title, locale).slice(0, 110),
        description: seo.description,
        image: image || undefined,
        datePublished: article.date || article.createdAt,
        dateModified: article.updatedAt,
        inLanguage: locale,
        articleSection: pick(article.category, locale) || undefined,
        author: byPerson ? { "@id": ids.person } : { "@type": "Person", name: author },
        publisher: { "@id": ids.person },
        mainEntityOfPage: { "@id": pageId },
        isPartOf: { "@id": ids.website },
      }),
    );
  }

  if (seo.project) {
    const project = seo.project;
    const clients = await getClients();
    const client = clients.find((row) => row.id === project.clientId);
    graph.push(
      compact({
        "@type": "CreativeWork",
        "@id": `${url}#work`,
        name: pick(project.name, locale),
        description: seo.description,
        image: image || undefined,
        url,
        dateCreated: /^\d{4}(-\d{2}){0,2}$/.test(project.year) ? project.year : undefined,
        inLanguage: locale,
        creator: { "@id": ids.person },
        // The brand the work was made for (a client, not an employer).
        about: client ? { "@type": "Organization", name: pick(client.name, locale) } : undefined,
        keywords: project.tags.length ? project.tags.join(", ") : undefined,
        mainEntityOfPage: { "@id": pageId },
        isPartOf: { "@id": ids.website },
      }),
    );
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

function pageType(seo: PageSeo): string {
  switch (seo.kind) {
    case "about":
      return "ProfilePage";
    case "contact":
      return "ContactPage";
    case "projects":
    case "articles":
    case "clients":
    case "services":
      return "CollectionPage";
    default:
      return "WebPage";
  }
}
