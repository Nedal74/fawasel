import { ArrowLeft, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectCard } from "@/components/public/ProjectCard";
import { Container } from "@/components/ui/Container";
import { Crosshair, DataTicks, TechLabel } from "@/components/ui/Decor";
import { Reveal } from "@/components/ui/Reveal";
import { getStrings } from "@/i18n/strings";
import {
  getClients,
  getContentMap,
  getProjectBySlug,
  getProjects,
  getServices,
  getSettings,
} from "@/lib/cms/queries";
import { getLocale, makeCopy, pick } from "@/lib/i18n";
import { whatsappLink } from "@/lib/utils";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const [project, locale] = await Promise.all([getProjectBySlug(slug), getLocale()]);
  if (!project) return { title: "Not found" };

  const title = pick(project.seoTitle, locale) || pick(project.name, locale);
  const description = pick(project.seoDescription, locale) || pick(project.summary, locale);
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: project.coverImage ? [{ url: project.coverImage }] : undefined,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

function Chapter({
  index,
  label,
  body,
}: {
  index: string;
  label: string;
  body: string;
}) {
  if (!body) return null;
  return (
    <Reveal className="grid gap-4 border-t border-[var(--color-line)] py-10 lg:grid-cols-12 lg:gap-10">
      <div className="lg:col-span-4">
        <span className="label text-accent">{index}</span>
        <h2 className="mt-2 text-xl font-semibold tracking-tight">{label}</h2>
      </div>
      <div className="lg:col-span-8">
        <p className="whitespace-pre-line text-sm leading-relaxed text-muted">{body}</p>
      </div>
    </Reveal>
  );
}

export default async function ProjectPage({ params }: Params) {
  const { slug } = await params;
  const locale = await getLocale();
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const [content, clients, services, allProjects, settings] = await Promise.all([
    getContentMap(),
    getClients(),
    getServices(),
    getProjects(),
    getSettings(),
  ]);

  const strings = getStrings(locale);
  const copy = makeCopy(content, locale);
  const name = pick(project.name, locale);
  const client = clients.find((row) => row.id === project.clientId);
  const projectServices = services.filter((service) => project.serviceIds.includes(service.id));
  const related = allProjects
    .filter((row) => row.id !== project.id)
    .filter((row) => !project.category.en || row.category.en === project.category.en)
    .slice(0, 2);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name,
    description: pick(project.summary, locale),
    dateCreated: project.year || undefined,
    creator: { "@type": "Person", name: copy("hero.name"), jobTitle: copy("hero.title") },
    ...(client ? { about: pick(client.name, locale) } : {}),
  };

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Cover */}
      <header className="grain relative min-h-[70vh] overflow-hidden border-b border-[var(--color-line)] bg-void pt-32">
        {project.coverImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={project.coverImage}
              alt={name}
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

        <Container className="relative flex min-h-[55vh] flex-col justify-end pb-12">
          <Link
            href="/projects"
            className="label inline-flex items-center gap-2 transition-colors hover:text-offwhite"
          >
            <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
            {strings.backToWork}
          </Link>
          <h1 className="display mt-6 max-w-4xl text-[clamp(2.25rem,6vw,4.75rem)]">{name}</h1>
          <dl className="mt-10 grid grid-cols-2 gap-px border border-[var(--color-line)] bg-[var(--color-line)] sm:grid-cols-4">
            {[
              [strings.client, client ? pick(client.name, locale) : ""],
              [strings.industry, pick(project.industry, locale)],
              [strings.year, project.year],
              [
                strings.services,
                projectServices.map((service) => pick(service.title, locale)).join(", "),
              ],
            ]
              .filter(([, value]) => Boolean(value))
              .map(([label, value]) => (
                <div key={label} className="bg-void/90 px-4 py-4">
                  <dt className="label text-[0.5625rem]">{label}</dt>
                  <dd className="mt-1.5 text-sm text-offwhite">{value}</dd>
                </div>
              ))}
          </dl>
        </Container>
      </header>

      <Container className="py-16 lg:py-24">
        {pick(project.summary, locale) ? (
          <Reveal className="max-w-3xl">
            <span className="label text-accent">00</span>
            <h2 className="sr-only">{strings.overview}</h2>
            <p className="mt-4 text-lg leading-relaxed text-offwhite/90">
              {pick(project.summary, locale)}
            </p>
          </Reveal>
        ) : null}

        <div className="mt-14">
          <Chapter index="01" label={strings.challenge} body={pick(project.challenge, locale)} />
          <Chapter index="02" label={strings.objective} body={pick(project.objective, locale)} />
          <Chapter index="03" label={strings.strategy} body={pick(project.strategy, locale)} />
          <Chapter index="04" label={strings.creative} body={pick(project.creativeDirection, locale)} />
          <Chapter index="05" label={strings.execution} body={pick(project.execution, locale)} />
          <Chapter index="06" label={strings.results} body={pick(project.results, locale)} />
        </div>

        {project.keyMetrics.length > 0 ? (
          <Reveal className="mt-8">
            <TechLabel>{strings.keyMetrics}</TechLabel>
            <dl className="mt-4 grid grid-cols-2 gap-px border border-[var(--color-line)] bg-[var(--color-line)] lg:grid-cols-4">
              {project.keyMetrics.map((metric, i) => (
                <div key={i} className="bg-void p-6">
                  <dt className="label text-[0.5625rem]">{pick(metric.label, locale)}</dt>
                  <dd className="accent-text mt-2 text-3xl font-bold tracking-tight">{metric.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        ) : null}

        {project.videoUrl ? (
          <Reveal className="mt-14">
            <div className="relative aspect-video w-full overflow-hidden border border-[var(--color-line)]">
              <iframe
                src={project.videoUrl}
                title={name}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          </Reveal>
        ) : null}

        {project.gallery.length > 0 ? (
          <section className="mt-16">
            <TechLabel>{strings.gallery}</TechLabel>
            <div className="mt-5 grid gap-6 md:grid-cols-2">
              {project.gallery.map((src, i) => (
                <Reveal
                  key={src + i}
                  delay={(i % 2) * 70}
                  className={i % 3 === 0 ? "md:col-span-2" : ""}
                >
                  <figure className="relative overflow-hidden border border-[var(--color-line)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`${name} — ${i + 1}`}
                      loading="lazy"
                      decoding="async"
                      className="w-full object-cover"
                    />
                    <Crosshair className="-left-1.5 -top-1.5" />
                    <Crosshair className="-bottom-1.5 -right-1.5" />
                  </figure>
                </Reveal>
              ))}
            </div>
          </section>
        ) : null}

        {project.externalUrl ? (
          <div className="mt-14">
            <a
              href={project.externalUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line-strong)] px-6 py-3 text-[0.6875rem] uppercase tracking-[0.18em] transition-colors hover:border-accent"
            >
              {strings.visitProject}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          </div>
        ) : null}

        <DataTicks className="mt-16 h-4" />
      </Container>

      {related.length > 0 ? (
        <Container as="section" className="border-t border-[var(--color-line)] py-20">
          <TechLabel>{strings.relatedProjects}</TechLabel>
          <div className="mt-8 grid gap-x-8 gap-y-12 md:grid-cols-2">
            {related.map((row, i) => (
              <ProjectCard
                key={row.id}
                project={row}
                locale={locale}
                index={i}
                ctaLabel={strings.viewCaseStudy}
              />
            ))}
          </div>
        </Container>
      ) : null}

      <Container as="section" className="grain relative border-t border-[var(--color-line)] py-24 text-center">
        <h2 className="display text-[clamp(2rem,5vw,3.5rem)]">{copy("contact.heading")}</h2>
        <p className="mx-auto mt-5 max-w-xl text-sm text-muted">{copy("contact.intro")}</p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link
            href="/contact"
            className="btn-shine rounded-full btn-accent px-7 py-3.5 text-xs font-medium uppercase tracking-[0.18em]"
          >
            {strings.startProject}
          </Link>
          <a
            href={whatsappLink(settings.whatsapp)}
            target="_blank"
            rel="noreferrer noopener"
            className="rounded-full border border-[var(--color-line-strong)] px-7 py-3.5 text-xs uppercase tracking-[0.18em] transition-colors hover:border-accent"
          >
            {strings.whatsapp}
          </a>
        </div>
      </Container>
    </article>
  );
}
