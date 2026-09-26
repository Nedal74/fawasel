import { getContentMap, getServices, getSettings, getSocialLinks } from "@/lib/cms/queries";
import type { Locale } from "@/lib/cms/types";
import { pick } from "@/lib/locale";
import { absoluteUrl, getSiteUrl, jsonLd } from "@/lib/seo";

/**
 * schema.org Person (+ WebSite on the homepage) built from the CMS, so search
 * engines connect the name, role, photo and social profiles to this site.
 */
export async function PersonJsonLd({ locale, withWebsite = false }: { locale: Locale; withWebsite?: boolean }) {
  const [settings, content, socials, services, base] = await Promise.all([
    getSettings(),
    getContentMap(),
    getSocialLinks(),
    getServices(),
    getSiteUrl(),
  ]);
  const copy = (key: string) => pick(content[key]?.value, locale);
  const nameEn = content["hero.name"]?.value.en || "";
  const nameAr = content["hero.name"]?.value.ar || "";

  const person = {
    "@type": "Person",
    "@id": `${base}/#person`,
    name: locale === "ar" ? nameAr || nameEn : nameEn || nameAr,
    alternateName: locale === "ar" ? nameEn : nameAr,
    jobTitle: copy("hero.title"),
    description: pick(settings.siteDescription, locale),
    url: `${base}/`,
    image: absoluteUrl(base, settings.heroImage) || undefined,
    email: settings.email ? `mailto:${settings.email}` : undefined,
    telephone: settings.whatsapp || undefined,
    sameAs: socials
      .filter((social) => social.url && !/wa\.me|whatsapp/i.test(social.url))
      .map((social) => social.url),
    knowsAbout: services.slice(0, 12).map((service) => pick(service.title, locale)),
    knowsLanguage: ["ar", "en"],
  };

  const graph: Record<string, unknown>[] = [person];
  if (withWebsite) {
    graph.push({
      "@type": "WebSite",
      "@id": `${base}/#website`,
      url: `${base}/`,
      name: pick(settings.siteTitle, locale),
      description: pick(settings.siteDescription, locale),
      inLanguage: ["en", "ar"],
      publisher: { "@id": `${base}/#person` },
    });
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLd({ "@context": "https://schema.org", "@graph": graph }) }}
    />
  );
}
