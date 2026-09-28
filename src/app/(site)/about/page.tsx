import type { Metadata } from "next";

import { PageHeader } from "@/components/public/PageHeader";
import { AboutSection, IntelligenceSection, SkillsSection } from "@/components/public/Sections";
import { getStrings } from "@/i18n/strings";
import {
  getContentMap,
  getMetrics,
  getServices,
  getSettings,
  getSkills,
} from "@/lib/cms/queries";
import { getLocale, makeCopy } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo-pages";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("/about");
}

export default async function AboutPage() {
  const locale = await getLocale();
  const [settings, content, skills, metrics, services] = await Promise.all([
    getSettings(),
    getContentMap(),
    getSkills(),
    getMetrics(),
    getServices(),
  ]);
  const copy = makeCopy(content, locale);
  const strings = getStrings(locale);
  // The Settings toggles hide a section everywhere it appears, not just on the
  // homepage.
  const enabled = (key: string) => settings.sections?.[key] !== false;

  return (
    <>
      <PageHeader
        eyebrow={copy("about.eyebrow")}
        title={copy("about.heading")}
        intro={copy("about.lead")}
      />
      <AboutSection
          copy={copy}
          strings={strings}
          image={settings.aboutImage}
          media={settings.aboutMedia}
          services={services}
          locale={locale}
        />
      {enabled("skills") ? <SkillsSection skills={skills} locale={locale} copy={copy} /> : null}
      {enabled("intelligence") ? (
        <IntelligenceSection metrics={metrics} locale={locale} copy={copy} />
      ) : null}
    </>
  );
}
