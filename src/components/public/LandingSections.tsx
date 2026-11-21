import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { LandingLeadForm } from "@/components/public/LandingLeadForm";
import { MethodSteps } from "@/components/public/MethodSteps";
import { ProjectCard } from "@/components/public/ProjectCard";
import { ProjectGallery } from "@/components/public/ProjectGallery";
import { ServicesSlider } from "@/components/public/ServicesSlider";
import { Container } from "@/components/ui/Container";
import { DataTicks, TechLabel } from "@/components/ui/Decor";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { UiStrings } from "@/i18n/strings";
import type { Client, LandingPage, Locale, Project, Service } from "@/lib/cms/types";
import { landingBlocks, landingStats } from "@/lib/landing";
import { pick } from "@/lib/locale";
import { whatsappLink } from "@/lib/utils";

/**
 * One service landing page, rendered from a `landing_pages` row.
 *
 * Every section disappears when its CMS field is empty, so a page can be as
 * short as a headline and a WhatsApp button, and the numbers always come from
 * the dashboard — the case studies are real projects, not retyped figures.
 */

const SECTION = "border-t border-[var(--color-line)] py-20 lg:py-28";

function WhatsAppCta({
  phone,
  message,
  label,
  slug,
  className = "",
}: {
  phone: string;
  message: string;
  label: string;
  slug: string;
  className?: string;
}) {
  if (!phone || !label) return null;
  return (
    <a
      href={whatsappLink(phone, message)}
      data-track-label={`landing:${slug}`}
      target="_blank"
      rel="noreferrer noopener"
      className={`group inline-flex items-center gap-2 bg-accent px-6 py-4 text-sm font-medium text-accent-ink transition-transform duration-300 hover:-translate-y-0.5 ${className}`}
    >
      {label}
      <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:-scale-x-100" aria-hidden />
    </a>
  );
}

export function LandingHero({
  page,
  locale,
  phone,
}: {
  page: LandingPage;
  locale: Locale;
  phone: string;
}) {
  const headline = pick(page.heroHeadline, locale);
  const subline = pick(page.heroSubline, locale);
  const stats = landingStats(page.heroStats, locale);
  const alt = pick(page.heroImageAlt, locale) || headline;
  const hasImage = Boolean(page.heroImage);

  return (
    <header className="grain relative overflow-hidden border-b border-[var(--color-line)] bg-void pt-32">
      {/* The cover sits behind the words, dimmed and faded into the page, the
          way a project page carries its own. */}
      {hasImage ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={page.heroImage}
            alt={alt}
            className="absolute inset-0 h-full w-full object-cover opacity-45"
            fetchPriority="high"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(to_top,var(--color-void)_8%,rgba(8,9,11,0.35)_70%)]"
          />
        </>
      ) : (
        <div className="grid-field absolute inset-0 opacity-50" aria-hidden />
      )}

      <Container className="relative flex min-h-[58vh] flex-col justify-end pb-12">
        <div className="flex items-center gap-3">
          <span className="animate-tick block h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
          <TechLabel>{pick(page.title, locale)}</TechLabel>
          <span className="accent-rule h-px w-16 opacity-70" aria-hidden />
        </div>

        <h1
          className="display animate-mask-up mt-6 max-w-5xl text-[clamp(2.25rem,6vw,4.75rem)]"
          style={{ animationDelay: "0.15s" }}
        >
          {headline}
        </h1>

        {subline ? (
          <p
            className="animate-rise mt-6 max-w-2xl text-sm leading-relaxed text-muted"
            style={{ animationDelay: "0.3s" }}
          >
            {subline}
          </p>
        ) : null}

        <div className="mt-9 flex flex-wrap items-center gap-4">
          <WhatsAppCta
            phone={phone}
            message={pick(page.whatsappMessage, locale)}
            label={pick(page.ctaLabel, locale)}
            slug={page.slug}
          />
          <DataTicks className="hidden h-3 sm:block" />
        </div>
      </Container>

      {stats.length > 0 ? (
        <Container className="relative pb-14">
          <dl className="grid gap-px border border-[var(--color-line)] bg-[var(--color-line)] sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-[var(--color-void)]/90 px-5 py-7 backdrop-blur-sm">
                {/* The figure leads; the sentence under it says what it counts. */}
                <dd className="display text-[clamp(2.25rem,5vw,3.5rem)] leading-none text-accent">
                  {stat.value}
                </dd>
                <dt className="mt-3 text-xs leading-relaxed text-muted">{stat.label}</dt>
              </div>
            ))}
          </dl>
        </Container>
      ) : null}
    </header>
  );
}

export function LandingOffer({
  page,
  locale,
  index,
  brand,
}: {
  page: LandingPage;
  locale: Locale;
  index: string;
  brand: string;
}) {
  const blocks = landingBlocks(page.offerItems, locale);
  if (blocks.length === 0) return null;
  const note = pick(page.offerNote, locale);

  return (
    <Container as="section" className={SECTION}>
      <SectionHeading index={index} title={pick(page.offerHeading, locale)} />
      <Reveal from="blur" delay={120} className="mt-12">
        {/* The same carousel the services section uses, so a service reads the
            same wherever the visitor meets it. */}
        <ServicesSlider
          brand={brand}
          services={blocks.map((block, i) => ({
            id: `${page.slug}-offer-${i}`,
            title: block.title,
            description: block.body,
            category: pick(page.title, locale),
            ctaLabel: "",
            ctaUrl: "",
          }))}
        />
      </Reveal>
      {note ? <p className="mt-8 max-w-2xl text-xs leading-relaxed text-dim">{note}</p> : null}
    </Container>
  );
}

/** Designs produced for clients, as a gallery that plays itself. */
export function LandingGallery({
  page,
  locale,
  index,
  strings,
  fallback = [],
}: {
  page: LandingPage;
  locale: Locale;
  index: string;
  strings: UiStrings;
  /** Case-study images, used until the page is given a gallery of its own. */
  fallback?: string[];
}) {
  const images = page.gallery?.length ? page.gallery : fallback;
  if (images.length === 0) return null;
  const heading = pick(page.galleryHeading, locale) || strings.gallery;

  return (
    <Container as="section" className={SECTION}>
      <SectionHeading index={index} title={heading} />
      <Reveal from="blur" delay={100} className="mt-10">
        <ProjectGallery
          images={images}
          name={heading}
          locale={locale}
          autoAdvanceMs={3500}
          labels={{
            previous: strings.galleryPrevious,
            next: strings.galleryNext,
            close: strings.galleryClose,
            enlarge: strings.galleryEnlarge,
            image: strings.galleryImage,
          }}
        />
      </Reveal>
    </Container>
  );
}

export function LandingMethod({
  page,
  locale,
  index,
}: {
  page: LandingPage;
  locale: Locale;
  index: string;
}) {
  const steps = landingBlocks(page.methodSteps, locale);
  if (steps.length === 0) return null;
  const heading = pick(page.methodHeading, locale);

  return (
    <Container as="section" className={SECTION}>
      <SectionHeading index={index} title={heading} />
      <Reveal delay={100} className="mt-12">
        <MethodSteps steps={steps} label={heading} />
      </Reveal>
    </Container>
  );
}

export function LandingCaseStudies({
  page,
  projects,
  clients,
  services,
  locale,
  strings,
  index,
}: {
  page: LandingPage;
  projects: Project[];
  clients: Client[];
  services: Service[];
  locale: Locale;
  strings: UiStrings;
  index: string;
}) {
  if (projects.length === 0) return null;
  return (
    <Container as="section" className={SECTION}>
      <SectionHeading index={index} title={pick(page.caseStudiesHeading, locale)} />
      <div className="mt-12 grid gap-10 md:grid-cols-2 lg:gap-14">
        {projects.map((project, i) => (
          <ProjectCard
            key={project.id}
            project={project}
            locale={locale}
            index={i}
            ctaLabel={strings.viewCaseStudy}
            client={clients.find((row) => row.id === project.clientId)}
            services={services.filter((row) => project.serviceIds?.includes(row.id))}
          />
        ))}
      </div>
    </Container>
  );
}

export function LandingFaq({ page, locale, index }: { page: LandingPage; locale: Locale; index: string }) {
  const items = landingBlocks(page.faqItems, locale);
  if (items.length === 0) return null;
  return (
    <Container as="section" className={SECTION}>
      <SectionHeading index={index} title={pick(page.faqHeading, locale)} />
      <div className="mt-10 border-t border-[var(--color-line)]">
        {items.map((item, i) => (
          <Reveal key={item.title} delay={i * 50} className="border-b border-[var(--color-line)]">
            <details className="group py-5">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
                <h3 className="text-sm font-medium">{item.title}</h3>
                <span
                  className="mt-0.5 shrink-0 text-accent transition-transform duration-300 group-open:rotate-45"
                  aria-hidden
                >
                  +
                </span>
              </summary>
              {item.body ? (
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">{item.body}</p>
              ) : null}
            </details>
          </Reveal>
        ))}
      </div>
    </Container>
  );
}

/** Two fields and a button: the lowest-friction way off this page. */
export function LandingLead({
  page,
  locale,
  strings,
  successMessage,
}: {
  page: LandingPage;
  locale: Locale;
  strings: UiStrings;
  successMessage: string;
}) {
  // The form is the page's only on-site conversion point, so it always shows;
  // the CMS supplies the wording when it has some.
  const heading = pick(page.leadHeading, locale) || strings.leadHeadingFallback;
  const body = pick(page.leadBody, locale) || strings.leadBodyFallback;

  return (
    <Container as="section" className={SECTION}>
      <Reveal>
        <div className="border border-[var(--color-line)] bg-[var(--color-graphite)] p-7 lg:p-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              {heading ? <h2 className="display text-[clamp(1.5rem,3vw,2.25rem)]">{heading}</h2> : null}
              {body ? <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">{body}</p> : null}
            </div>
          </div>
          <div className="mt-8">
            <LandingLeadForm
              strings={strings}
              service={pick(page.title, locale)}
              slug={page.slug}
              buttonLabel={pick(page.leadButton, locale)}
              successMessage={successMessage}
            />
          </div>
        </div>
      </Reveal>
    </Container>
  );
}

export function LandingClosing({
  page,
  locale,
  phone,
}: {
  page: LandingPage;
  locale: Locale;
  phone: string;
}) {
  const heading = pick(page.closingHeading, locale);
  const body = pick(page.closingBody, locale);
  if (!heading && !body) return null;
  return (
    <Container as="section" className={SECTION}>
      <Reveal from="blur">
        <div className="border border-[var(--color-line)] px-6 py-12 text-center sm:px-12 lg:py-16">
          {heading ? <h2 className="display text-[clamp(1.75rem,4vw,3rem)]">{heading}</h2> : null}
          {body ? <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-muted">{body}</p> : null}
          <div className="mt-9 flex justify-center">
            <WhatsAppCta
              phone={phone}
              message={pick(page.whatsappMessage, locale)}
              label={pick(page.ctaLabel, locale)}
              slug={page.slug}
            />
          </div>
        </div>
      </Reveal>
    </Container>
  );
}

/** The "service pages" block on /services, linking out to each landing page. */
export function ServiceLandingsSection({
  pages,
  locale,
  heading,
  intro,
  eyebrow,
  ctaLabel,
}: {
  pages: LandingPage[];
  locale: Locale;
  heading: string;
  intro: string;
  eyebrow: string;
  ctaLabel: string;
}) {
  if (pages.length === 0) return null;

  return (
    <Container as="section" id="service-pages" className={SECTION}>
      <SectionHeading index="04" eyebrow={eyebrow} title={heading} intro={intro} />
      <ul
        className={`mt-12 grid gap-px border border-[var(--color-line)] bg-[var(--color-line)] ${
          pages.length > 1 ? "md:grid-cols-2" : ""
        }`}
      >
        {pages.map((page, i) => {
          const stats = landingStats(page.heroStats, locale).slice(0, 3);
          return (
            <Reveal as="li" key={page.id} delay={i * 70} className="bg-[var(--color-void)]">
              <Link
                href={`/services/${page.slug}`}
                className="group flex h-full flex-col justify-between gap-6 p-7 transition-colors duration-300 hover:bg-[var(--color-graphite)] lg:p-9"
              >
                <div>
                  <h3 className="display text-2xl lg:text-3xl">{pick(page.title, locale)}</h3>
                  <p className="mt-4 text-sm leading-relaxed text-muted">{pick(page.heroSubline, locale)}</p>
                </div>
                <div>
                  {stats.length > 0 ? (
                    <ul className="flex flex-wrap gap-x-6 gap-y-2 border-t border-[var(--color-line)] pt-5">
                      {stats.map((stat) => (
                        <li key={stat.label} className="text-xs">
                          <span className="font-medium text-accent">{stat.value}</span>{" "}
                          <span className="text-dim">{stat.label}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <span className="mt-5 inline-flex items-center gap-2 text-xs font-medium">
                    {ctaLabel}
                    <ArrowUpRight
                      className="h-3.5 w-3.5 text-accent transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:-scale-x-100"
                      aria-hidden
                    />
                  </span>
                </div>
              </Link>
            </Reveal>
          );
        })}
      </ul>
    </Container>
  );
}
