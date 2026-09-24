import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import type { Client, Locale, Project, Service } from "@/lib/cms/types";
import { pick } from "@/lib/locale";
import { cn } from "@/lib/utils";

/**
 * Large editorial work card: image, client, title, industry, services, year.
 */
export function ProjectCard({
  project,
  locale,
  ctaLabel,
  index,
  client,
  services = [],
  eager = false,
  className,
}: {
  project: Project;
  locale: Locale;
  ctaLabel: string;
  index: number;
  client?: Client;
  services?: Service[];
  eager?: boolean;
  className?: string;
}) {
  const name = pick(project.name, locale);
  const industry = pick(project.industry, locale) || pick(project.category, locale);
  const summary = pick(project.summary, locale);
  const clientName = client ? pick(client.name, locale) : "";
  const serviceNames = services.map((service) => pick(service.title, locale)).filter(Boolean);
  const hasCover = Boolean(project.coverImage);

  return (
    <article className={cn("group relative", className)}>
      <Link href={`/projects/${project.slug}`} className="block focus-visible:outline-none">
        <div
          className={cn(
            "relative overflow-hidden border border-[var(--color-line)] bg-graphite",
            // Without artwork the card stays short instead of leaving a tall empty frame.
            hasCover ? "aspect-[16/10] max-h-[560px]" : "aspect-[16/6] min-h-[220px]",
          )}
        >
          {project.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={project.coverImage}
              alt={name}
              loading={eager ? "eager" : "lazy"}
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
            />
          ) : (
            <div className="grid-field flex h-full w-full items-center justify-center opacity-70">
              <span className="display text-[clamp(2rem,6vw,4rem)] text-[var(--color-graphite-hard)]">
                {name.slice(0, 2)}
              </span>
            </div>
          )}

          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.9),transparent_55%)]"
          />

          <span className="absolute start-5 top-5 text-[0.625rem] uppercase tracking-[0.2em] text-white/70">
            {String(index + 1).padStart(2, "0")}
          </span>

          <span className="absolute end-5 top-5 flex h-10 w-10 translate-y-1 items-center justify-center rounded-full bg-accent text-accent-ink opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:opacity-100">
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </span>

          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
            {clientName ? (
              <p className="text-[0.625rem] uppercase tracking-[0.22em] text-accent">{clientName}</p>
            ) : null}
            <h3 className="display mt-2 text-[clamp(1.35rem,3vw,2.25rem)] text-white">{name}</h3>
          </div>
        </div>

        <div className="mt-5 grid gap-4 border-t border-[var(--color-line)] pt-4 sm:grid-cols-12">
          <div className="sm:col-span-7">
            {industry ? (
              <p className="text-[0.625rem] uppercase tracking-[0.2em] text-muted">{industry}</p>
            ) : null}
            {summary ? <p className="mt-2 line-clamp-2 text-sm text-muted">{summary}</p> : null}
          </div>

          <div className="sm:col-span-5 sm:text-end">
            {serviceNames.length > 0 ? (
              <p className="text-[0.6875rem] text-dim">{serviceNames.slice(0, 3).join(" • ")}</p>
            ) : null}
            <p className="mt-2 flex items-center gap-3 text-[0.625rem] uppercase tracking-[0.2em] sm:justify-end">
              {project.year ? <span className="text-dim">{project.year}</span> : null}
              <span className="text-accent transition-colors group-hover:text-white">{ctaLabel} →</span>
            </p>
          </div>
        </div>
      </Link>
    </article>
  );
}
