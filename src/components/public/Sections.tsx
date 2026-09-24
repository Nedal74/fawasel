import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { ArticleCard } from "@/components/public/ArticleCard";
import { ClientsMarquee } from "@/components/public/ClientsMarquee";
import { MetricsCarousel } from "@/components/public/MetricsCarousel";
import { ProjectCard } from "@/components/public/ProjectCard";
import { ServicesSlider } from "@/components/public/ServicesSlider";
import { TestimonialsSlider } from "@/components/public/TestimonialsSlider";
import { Container } from "@/components/ui/Container";
import { Crosshair, DataTicks, TechLabel } from "@/components/ui/Decor";
import { EmptyState } from "@/components/ui/EmptyState";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { UiStrings } from "@/i18n/strings";
import type {
  Article,
  Client,
  Locale,
  Metric,
  Project,
  Service,
  Skill,
  Testimonial,
} from "@/lib/cms/types";
import { pick } from "@/lib/locale";

type Copy = (key: string) => string;

const SECTION = "border-t border-[var(--color-line)] py-24 lg:py-32";

/* ---------------------------------------------------------------- About -- */

export function AboutSection({
  copy,
  image,
  strings,
}: {
  copy: Copy;
  image: string;
  strings: UiStrings;
}) {
  const primaryLabel = copy("about.ctaPrimary") || strings.viewAllWork;
  const secondaryLabel = copy("about.ctaSecondary") || strings.startProject;

  return (
    <Container as="section" id="about" className={`relative ${SECTION}`}>
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <Reveal from="left" className="relative lg:col-span-5">
          <figure className="relative aspect-[4/5] overflow-hidden border border-[var(--color-line)] bg-graphite">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt={copy("hero.name")}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover object-top"
              />
            ) : (
              <div className="grid-field h-full w-full opacity-60" aria-hidden />
            )}
            <Crosshair className="-left-1.5 -top-1.5" />
            <Crosshair className="-bottom-1.5 -right-1.5" />
          </figure>
          <div className="mt-4 flex items-center justify-between">
            <TechLabel>FIG. 01 — PROFILE</TechLabel>
            <DataTicks count={16} className="h-3" />
          </div>
        </Reveal>

        <div className="lg:col-span-7 lg:pt-6">
          <SectionHeading
            index="02"
            eyebrow={copy("about.eyebrow")}
            title={copy("about.heading")}
            from="right"
          />
          <Reveal from="up" delay={120}>
            <p className="mt-8 text-[clamp(1.05rem,2vw,1.4rem)] leading-relaxed text-offwhite">
              {copy("about.lead")}
            </p>
            <p className="mt-6 text-sm leading-relaxed text-muted">{copy("about.body")}</p>
            <p className="mt-4 text-sm leading-relaxed text-muted">{copy("about.body2")}</p>
            <blockquote className="mt-8 border-s-2 border-accent ps-5 text-base leading-relaxed text-offwhite/90">
              {copy("hero.philosophy")}
            </blockquote>
          </Reveal>

          <Reveal from="left" delay={220} className="mt-10 flex flex-wrap gap-3">
            <Link
              href={copy("about.ctaPrimaryUrl") || "/projects"}
              className="btn-shine btn-accent rounded-full px-7 py-3.5 text-[0.6875rem] font-medium uppercase tracking-[0.18em]"
            >
              {primaryLabel}
            </Link>
            <Link
              href={copy("about.ctaSecondaryUrl") || "/contact"}
              className="rounded-full border border-[var(--color-line-strong)] px-7 py-3.5 text-[0.6875rem] uppercase tracking-[0.18em] transition-colors hover:border-accent hover:text-accent"
            >
              {secondaryLabel}
            </Link>
          </Reveal>
        </div>
      </div>
    </Container>
  );
}

/* ------------------------------------------------------------- Services -- */

export function ServicesSection({
  services,
  locale,
  copy,
  strings,
}: {
  services: Service[];
  locale: Locale;
  copy: Copy;
  strings: UiStrings;
}) {
  if (services.length === 0) return null;

  return (
    <Container as="section" id="services" className={SECTION}>
      <SectionHeading
        index="03"
        eyebrow={copy("services.eyebrow")}
        title={copy("services.heading")}
        intro={copy("services.intro")}
      />
      <Reveal from="blur" delay={120} className="mt-12">
        <ServicesSlider
          brand={copy("hero.name")}
          services={services.map((service) => ({
            id: service.id,
            title: pick(service.title, locale),
            description: pick(service.shortDescription, locale),
            category: pick(service.category, locale),
            ctaLabel: pick(service.ctaLabel, locale) || strings.exploreService,
            ctaUrl: service.ctaUrl || "/contact",
          }))}
        />
      </Reveal>
    </Container>
  );
}

/* ------------------------------------------------------------ Work grid -- */

export function WorkSection({
  projects,
  clients,
  services,
  locale,
  copy,
  strings,
  showAllLink = true,
}: {
  projects: Project[];
  clients: Client[];
  services: Service[];
  locale: Locale;
  copy: Copy;
  strings: UiStrings;
  showAllLink?: boolean;
}) {
  return (
    <Container as="section" id="work" className={SECTION}>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading
          index="04"
          eyebrow={copy("work.eyebrow")}
          title={copy("work.heading")}
          intro={copy("work.intro")}
        />
        {showAllLink ? (
          <Reveal from="right">
            <Link
              href="/projects"
              className="group inline-flex items-center gap-2 text-[0.6875rem] uppercase tracking-[0.18em] text-muted transition-colors hover:text-accent"
            >
              {strings.viewAllWork}
              <ArrowUpRight
                className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden
              />
            </Link>
          </Reveal>
        ) : null}
      </div>

      {projects.length > 0 ? (
        <div className="mt-14 grid gap-x-10 gap-y-16 md:grid-cols-2">
          {projects.map((project, i) => (
            <Reveal
              key={project.id}
              from={i % 2 === 0 ? "left" : "right"}
              delay={(i % 2) * 80}
              className={i % 3 === 0 ? "md:col-span-2" : ""}
            >
              <ProjectCard
                project={project}
                locale={locale}
                index={i}
                eager={i === 0}
                ctaLabel={strings.viewCaseStudy}
                client={clients.find((client) => client.id === project.clientId)}
                services={services.filter((service) => project.serviceIds.includes(service.id))}
              />
            </Reveal>
          ))}
        </div>
      ) : (
        <EmptyState className="mt-14" message={copy("work.empty")} />
      )}
    </Container>
  );
}

/* --------------------------------------------------------------- Skills -- */

export function SkillsSection({
  skills,
  locale,
  copy,
}: {
  skills: Skill[];
  locale: Locale;
  copy: Copy;
}) {
  if (skills.length === 0) return null;

  const groups = new Map<string, Skill[]>();
  for (const skill of skills) {
    const key = pick(skill.category, locale) || "—";
    groups.set(key, [...(groups.get(key) ?? []), skill]);
  }

  // A plain, quiet list: one short column per category on desktop, stacked on
  // phones. No pills, no illustration — the section stays out of the way.
  return (
    <Container as="section" id="skills" className="border-t border-[var(--color-line)] py-16 lg:py-20">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <span className="label text-accent">05</span>
        <span className="label">{copy("skills.eyebrow")}</span>
        <h2 className="display text-[clamp(1.5rem,3vw,2.25rem)]">{copy("skills.heading")}</h2>
      </div>

      {/* CSS columns rather than a grid, so short categories don't leave holes. */}
      <div className="mt-8 gap-x-10 border-t border-[var(--color-line)] pt-8 sm:columns-2 lg:columns-4">
        {[...groups.entries()].map(([category, items], groupIndex) => (
          <Reveal key={category} from="up" delay={groupIndex * 60} className="mb-8 break-inside-avoid">
            <p className="label text-[0.625rem] text-accent">{category}</p>
            <ul className="mt-3 space-y-1.5">
              {items.map((skill) => (
                <li key={skill.id} className="text-sm text-muted">
                  {pick(skill.name, locale)}
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>
    </Container>
  );
}

/* -------------------------------------------------------------- Metrics -- */

export function IntelligenceSection({
  metrics,
  locale,
  copy,
}: {
  metrics: Metric[];
  locale: Locale;
  copy: Copy;
}) {
  if (metrics.length === 0) return null;

  return (
    <Container as="section" id="intelligence" className={`grain relative ${SECTION}`}>
      <SectionHeading
        index="06"
        eyebrow={copy("intelligence.eyebrow")}
        title={copy("intelligence.heading")}
        intro={copy("intelligence.intro")}
      />
      <Reveal from="up" delay={120} className="mt-14">
        <MetricsCarousel
          metrics={metrics.map((metric) => ({
            id: metric.id,
            label: pick(metric.label, locale),
            value: metric.value,
            prefix: metric.prefix,
            suffix: metric.suffix,
            description: pick(metric.description, locale),
          }))}
        />
      </Reveal>
    </Container>
  );
}

/* -------------------------------------------------------------- Clients -- */

export function ClientsSection({
  clients,
  locale,
  copy,
}: {
  clients: Client[];
  locale: Locale;
  copy: Copy;
}) {
  return (
    <Container as="section" id="clients" className={SECTION}>
      <SectionHeading
        index="07"
        eyebrow={copy("clients.eyebrow")}
        title={copy("clients.heading")}
      />
      {clients.length > 0 ? (
        <Reveal from="up" delay={100} className="mt-12">
          <ClientsMarquee
            clients={clients.map((client) => ({
              id: client.id,
              name: pick(client.name, locale),
              logo: client.logo,
              website: client.website,
            }))}
          />
        </Reveal>
      ) : (
        <EmptyState className="mt-12" message={copy("clients.empty")} />
      )}
    </Container>
  );
}

/* --------------------------------------------------------- Testimonials -- */

export function TestimonialsSection({
  testimonials,
  locale,
  copy,
}: {
  testimonials: Testimonial[];
  locale: Locale;
  copy: Copy;
}) {
  return (
    <Container as="section" id="testimonials" className={SECTION}>
      <SectionHeading
        index="08"
        eyebrow={copy("testimonials.eyebrow")}
        title={copy("testimonials.heading")}
      />
      {testimonials.length > 0 ? (
        <Reveal from="up" delay={100} className="mt-12">
          <TestimonialsSlider
            testimonials={testimonials.map((testimonial) => ({
              id: testimonial.id,
              name: pick(testimonial.name, locale),
              role: pick(testimonial.role, locale),
              company: pick(testimonial.company, locale),
              quote: pick(testimonial.quote, locale),
              photo: testimonial.photo,
            }))}
          />
        </Reveal>
      ) : (
        <EmptyState className="mt-12" message={copy("testimonials.empty")} />
      )}
    </Container>
  );
}

/* ------------------------------------------------------------- Articles -- */

export function ArticlesSection({
  articles,
  locale,
  copy,
  strings,
  showAllLink = true,
}: {
  articles: Article[];
  locale: Locale;
  copy: Copy;
  strings: UiStrings;
  showAllLink?: boolean;
}) {
  return (
    <Container as="section" id="articles" className={SECTION}>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading
          index="09"
          eyebrow={copy("articles.eyebrow")}
          title={copy("articles.heading")}
          intro={copy("articles.intro")}
        />
        {showAllLink && articles.length > 0 ? (
          <Reveal from="right">
            <Link
              href="/articles"
              className="group inline-flex items-center gap-2 text-[0.6875rem] uppercase tracking-[0.18em] text-muted transition-colors hover:text-accent"
            >
              {strings.allArticles}
              <ArrowUpRight
                className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden
              />
            </Link>
          </Reveal>
        ) : null}
      </div>

      {articles.length > 0 ? (
        <div className="mt-12 grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article, i) => (
            <Reveal key={article.id} from="up" delay={(i % 3) * 80}>
              <ArticleCard article={article} locale={locale} ctaLabel={strings.readArticle} />
            </Reveal>
          ))}
        </div>
      ) : (
        <EmptyState className="mt-12" message={copy("articles.empty")} />
      )}
    </Container>
  );
}
