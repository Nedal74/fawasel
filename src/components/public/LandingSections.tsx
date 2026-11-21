import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { ProjectCard } from "@/components/public/ProjectCard";
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

  return (
    <Container as="header" className="grain relative pb-14 pt-36 lg:pb-20 lg:pt-44">
      <div className="grid-field pointer-events-none absolute inset-0 -z-10 opacity-50" aria-hidden />
      <div className="flex items-center gap-3">
        <span className="animate-tick block h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
        <TechLabel>{pick(page.title, locale)}</TechLabel>
        <span className="accent-rule h-px w-16 opacity-70" aria-hidden />
      </div>

      <h1 className="display animate-mask-up mt-6 text-[clamp(2.25rem,6vw,4.75rem)]" style={{ animationDelay: "0.15s" }}>
        {headline}
      </h1>

      {subline ? (
        <p className="animate-rise mt-6 max-w-2xl text-sm leading-relaxed text-muted" style={{ animationDelay: "0.3s" }}>
          {subline}
        </p>
      ) : null}

      {page.heroImage ? (
        <Reveal from="blur" delay={120} className="mt-10">
          <figure className="relative overflow-hidden border border-[var(--color-line)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={page.heroImage}
              alt={alt}
              width={1600}
              height={900}
              className="aspect-[16/9] w-full object-cover"
            />
          </figure>
        </Reveal>
      ) : null}

      {stats.length > 0 ? (
        <Reveal delay={160} className="mt-10">
          <dl className="grid gap-px border border-[var(--color-line)] bg-[var(--color-line)] sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-[var(--color-void)] px-5 py-6">
                <dt className="label text-[0.625rem] text-dim">{stat.label}</dt>
                <dd className="display mt-2 text-3xl text-accent">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      ) : null}

      <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-[var(--color-line)] pt-8">
        <WhatsAppCta
          phone={phone}
          message={pick(page.whatsappMessage, locale)}
          label={pick(page.ctaLabel, locale)}
          slug={page.slug}
        />
        <DataTicks className="hidden h-3 sm:block" />
      </div>
    </Container>
  );
}

/** Numbered list used for both the offer and the method. */
function BlockList({
  heading,
  index,
  blocks,
  note,
}: {
  heading: string;
  index: string;
  blocks: { title: string; body: string }[];
  note?: string;
}) {
  if (blocks.length === 0) return null;
  return (
    <Container as="section" className={SECTION}>
      <SectionHeading index={index} title={heading} />
      <ol className="mt-10 border-t border-[var(--color-line)]">
        {blocks.map((block, i) => (
          <Reveal as="li" key={block.title} delay={i * 60} className="border-b border-[var(--color-line)]">
            <div className="grid gap-2 py-6 sm:grid-cols-[3rem_1fr] sm:gap-6">
              <span className="label text-[0.625rem] text-accent">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3 className="text-base font-medium">{block.title}</h3>
                {block.body ? (
                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{block.body}</p>
                ) : null}
              </div>
            </div>
          </Reveal>
        ))}
      </ol>
      {note ? <p className="mt-6 max-w-2xl text-xs leading-relaxed text-dim">{note}</p> : null}
    </Container>
  );
}

export function LandingOffer({ page, locale, index }: { page: LandingPage; locale: Locale; index: string }) {
  return (
    <BlockList
      index={index}
      heading={pick(page.offerHeading, locale)}
      blocks={landingBlocks(page.offerItems, locale)}
      note={pick(page.offerNote, locale)}
    />
  );
}

export function LandingMethod({ page, locale, index }: { page: LandingPage; locale: Locale; index: string }) {
  return (
    <BlockList
      index={index}
      heading={pick(page.methodHeading, locale)}
      blocks={landingBlocks(page.methodSteps, locale)}
    />
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
