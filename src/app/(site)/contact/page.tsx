import type { Metadata } from "next";

import { ContactSection } from "@/components/public/ContactSection";
import { PageHeader } from "@/components/public/PageHeader";
import { getStrings } from "@/i18n/strings";
import { getContentMap, getServices, getSettings, getSocialLinks } from "@/lib/cms/queries";
import { getLocale, makeCopy } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo-pages";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("/contact");
}

export default async function ContactPage() {
  const locale = await getLocale();
  const [content, services, settings, socials] = await Promise.all([
    getContentMap(),
    getServices(),
    getSettings(),
    getSocialLinks(),
  ]);
  const copy = makeCopy(content, locale);
  const strings = getStrings(locale);

  return (
    <>
      <PageHeader
        eyebrow={copy("contact.eyebrow")}
        title={copy("contact.heading")}
        intro={copy("contact.intro")}
      />
      <ContactSection
        settings={settings}
        services={services}
        socials={socials}
        locale={locale}
        copy={copy}
        strings={strings}
      />
    </>
  );
}
