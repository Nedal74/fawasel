import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import type { Article, Locale } from "@/lib/cms/types";
import { pick } from "@/lib/locale";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

export function ArticleCard({
  article,
  locale,
  ctaLabel,
  className,
}: {
  article: Article;
  locale: Locale;
  ctaLabel: string;
  className?: string;
}) {
  const title = pick(article.title, locale);
  const summary = pick(article.summary, locale);
  const category = pick(article.category, locale);

  return (
    <article className={cn("group", className)}>
      <Link href={`/articles/${article.slug}`} className="block focus-visible:outline-none">
        <div className="relative aspect-[16/10] overflow-hidden border border-[var(--color-line)] bg-graphite">
          {article.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.coverImage}
              alt={title}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
            />
          ) : (
            <div className="grid-field h-full w-full opacity-60" aria-hidden />
          )}
          {category ? (
            <span className="absolute start-4 top-4 bg-accent px-3 py-1 text-[0.625rem] uppercase tracking-[0.16em] text-accent-ink">
              {category}
            </span>
          ) : null}
        </div>

        <div className="mt-5">
          {article.date ? (
            <p className="text-[0.625rem] uppercase tracking-[0.2em] text-dim">
              {formatDate(article.date, locale)}
            </p>
          ) : null}
          <h3 className="mt-2 text-lg font-semibold leading-snug transition-colors group-hover:text-accent">
            {title}
          </h3>
          {summary ? <p className="mt-2 line-clamp-2 text-sm text-muted">{summary}</p> : null}
          <span className="mt-4 inline-flex items-center gap-2 text-[0.625rem] uppercase tracking-[0.18em] text-accent">
            {ctaLabel}
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
          </span>
        </div>
      </Link>
    </article>
  );
}
