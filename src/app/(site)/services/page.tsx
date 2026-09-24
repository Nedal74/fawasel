import type { Metadata } from "next";

import { ContactSection } from "@/components/public/ContactSection";
import { PageHeader } from "@/components/public/PageHeader";
import { ServicesSection } from "@/components/public/Sections";
import { getStrings } from "@/i18n/strings";
import { getContentMap, getServices, getSettings, getSocialLinks } from "@/lib/cms/queries";
import { getLocale, makeCopy } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const [content, locale] = await Promise.all([getContentMap(), getLocale()]);
  const copy = makeCopy(content, locale);
  return { title: copy("services.heading"), description: copy("services.intro") };
}

export default async function ServicesPage() {
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
        eyebrow={copy("services.eyebrow")}
        title={copy("services.heading")}
        intro={copy("services.intro")}
      />
      <ServicesSection services={services} locale={locale} copy={copy} strings={strings} />
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
