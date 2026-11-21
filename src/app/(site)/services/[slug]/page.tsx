import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  LandingCaseStudies,
  LandingClosing,
  LandingFaq,
  LandingHero,
  LandingMethod,
  LandingOffer,
} from "@/components/public/LandingSections";
import { getStrings } from "@/i18n/strings";
import {
  getClients,
  getLandingPageBySlug,
  getLandingPages,
  getProjects,
  getServices,
  getSettings,
} from "@/lib/cms/queries";
import { getLocale } from "@/lib/i18n";
import { landingBlocks } from "@/lib/landing";
import { pageMetadata } from "@/lib/seo-pages";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  return pageMetadata(`/services/${slug}`);
}

export async function generateStaticParams() {
  const pages = await getLandingPages().catch(() => []);
  return pages.map((page) => ({ slug: page.slug }));
}

export default async function ServiceLandingPage({ params }: Params) {
  const { slug } = await params;
  const locale = await getLocale();
  const page = await getLandingPageBySlug(decodeURIComponent(slug));
  if (!page) notFound();

  const [settings, projects, clients, services] = await Promise.all([
    getSettings(),
    getProjects(),
    getClients(),
    getServices(),
  ]);
  const strings = getStrings(locale);

  // Case studies keep the dashboard's order, so the page reads top-down.
  const picked = page.projectIds
    .map((id) => projects.find((project) => project.id === id))
    .filter((project): project is NonNullable<typeof project> => Boolean(project));

  // Section numbers count only the sections that actually render, so an empty
  // block never leaves a gap in the sequence.
  let section = 0;
  const nextIndex = () => String(++section).padStart(2, "0");
  const offerIndex = landingBlocks(page.offerItems, locale).length > 0 ? nextIndex() : "";
  const methodIndex = landingBlocks(page.methodSteps, locale).length > 0 ? nextIndex() : "";
  const caseIndex = picked.length > 0 ? nextIndex() : "";
  const faqIndex = landingBlocks(page.faqItems, locale).length > 0 ? nextIndex() : "";

  return (
    <main>
      <LandingHero page={page} locale={locale} phone={settings.whatsapp} />
      <LandingOffer page={page} locale={locale} index={offerIndex} />
      <LandingMethod page={page} locale={locale} index={methodIndex} />
      <LandingCaseStudies
        page={page}
        projects={picked}
        clients={clients}
        services={services}
        locale={locale}
        strings={strings}
        index={caseIndex}
      />
      <LandingFaq page={page} locale={locale} index={faqIndex} />
      <LandingClosing page={page} locale={locale} phone={settings.whatsapp} />
    </main>
  );
}
