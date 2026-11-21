import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  LandingCaseStudies,
  LandingClosing,
  LandingFaq,
  LandingGallery,
  LandingHero,
  LandingLead,
  LandingMethod,
  LandingOffer,
} from "@/components/public/LandingSections";
import { getStrings } from "@/i18n/strings";
import {
  getClients,
  getContentMap,
  getLandingPageBySlug,
  getProjects,
  getServices,
  getSettings,
} from "@/lib/cms/queries";
import { getLocale, makeCopy } from "@/lib/i18n";
import { landingBlocks } from "@/lib/landing";
import { pageMetadata } from "@/lib/seo-pages";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  return pageMetadata(`/services/${slug}`);
}

export default async function ServiceLandingPage({ params }: Params) {
  const { slug } = await params;
  const locale = await getLocale();
  const page = await getLandingPageBySlug(decodeURIComponent(slug));
  if (!page) notFound();

  const [settings, projects, clients, services, content] = await Promise.all([
    getSettings(),
    getProjects(),
    getClients(),
    getServices(),
    getContentMap(),
  ]);
  const strings = getStrings(locale);
  const copy = makeCopy(content, locale);

  // Case studies keep the dashboard's order, so the page reads top-down.
  const picked = page.projectIds
    .map((id) => projects.find((project) => project.id === id))
    .filter((project): project is NonNullable<typeof project> => Boolean(project));

  // Section numbers count only the sections that actually render, so an empty
  // block never leaves a gap in the sequence.
  let section = 0;
  const nextIndex = () => String(++section).padStart(2, "0");
  const offerIndex = landingBlocks(page.offerItems, locale).length > 0 ? nextIndex() : "";
  // Until the page has a gallery of its own, it borrows the case studies'.
  const galleryImages = page.gallery?.length
    ? page.gallery
    : picked.flatMap((project) => [project.coverImage, ...project.gallery]).filter(Boolean);
  const galleryIndex = galleryImages.length > 0 ? nextIndex() : "";
  const methodIndex = landingBlocks(page.methodSteps, locale).length > 0 ? nextIndex() : "";
  const caseIndex = picked.length > 0 ? nextIndex() : "";
  const faqIndex = landingBlocks(page.faqItems, locale).length > 0 ? nextIndex() : "";

  return (
    <main>
      <LandingHero page={page} locale={locale} phone={settings.whatsapp} />
      <LandingOffer page={page} locale={locale} index={offerIndex} brand={copy("hero.name")} />
      <LandingGallery
        page={page}
        locale={locale}
        index={galleryIndex}
        strings={strings}
        fallback={galleryImages}
      />
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
      <LandingLead
        page={page}
        locale={locale}
        strings={strings}
        successMessage={copy("contact.success") || strings.formSubmit}
      />
      <LandingClosing page={page} locale={locale} phone={settings.whatsapp} />
    </main>
  );
}
