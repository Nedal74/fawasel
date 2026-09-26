import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArticleCard } from "@/components/public/ArticleCard";
import { Container } from "@/components/ui/Container";
import { DataTicks, TechLabel } from "@/components/ui/Decor";
import { Reveal } from "@/components/ui/Reveal";
import { getStrings } from "@/i18n/strings";
import { getArticleBySlug, getArticles, getContentMap } from "@/lib/cms/queries";
import { getLocale, makeCopy, pick } from "@/lib/i18n";
import { absoluteUrl, getSiteUrl, jsonLd } from "@/lib/seo";
import { formatDate, parseArticleBody } from "@/lib/utils";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const [article, locale] = await Promise.all([getArticleBySlug(slug), getLocale()]);
  if (!article) return { title: "Not found" };

  const title = pick(article.seoTitle, locale) || pick(article.title, locale);
  const description = pick(article.seoDescription, locale) || pick(article.summary, locale);
  return {
    title,
    description,
    openGraph: {
      type: "article",
      title,
      description,
      publishedTime: article.date || undefined,
      images: article.coverImage ? [{ url: article.coverImage }] : undefined,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ArticlePage({ params }: Params) {
  const { slug } = await params;
  const locale = await getLocale();
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const [content, all] = await Promise.all([getContentMap(), getArticles()]);
  const strings = getStrings(locale);
  const copy = makeCopy(content, locale);

  const title = pick(article.title, locale);
  const category = pick(article.category, locale);
  const body = parseArticleBody(pick(article.content, locale));
  const related = all.filter((row) => row.id !== article.id).slice(0, 3);

  const base = await getSiteUrl();
  const url = `${base}/articles/${article.slug}`;
  const authorName = article.author || copy("hero.name");
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline: title.slice(0, 110),
    description: pick(article.summary, locale),
    inLanguage: locale,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    datePublished: article.date || article.createdAt,
    dateModified: article.updatedAt,
    articleSection: category || undefined,
    author: { "@type": "Person", name: authorName, url: `${base}/about` },
    publisher: { "@type": "Person", "@id": `${base}/#person`, name: copy("hero.name") },
    ...(article.coverImage ? { image: absoluteUrl(base, article.coverImage) } : {}),
  };

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(articleLd) }}
      />

      <Container as="header" className="grain relative pb-10 pt-40 lg:pt-48">
        <div className="grid-field pointer-events-none absolute inset-0 -z-10 opacity-40" aria-hidden />
        <Link
          href="/articles"
          className="label inline-flex items-center gap-2 transition-colors hover:text-accent"
        >
          <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
          {strings.backToArticles}
        </Link>

        <h1 className="display animate-mask-up mt-6 max-w-4xl text-[clamp(2rem,5.5vw,4.25rem)]">
          {title}
        </h1>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[var(--color-line)] pt-4">
          {category ? <TechLabel>{category}</TechLabel> : null}
          {article.date ? (
            <TechLabel>
              {strings.publishedOn} {formatDate(article.date, locale)}
            </TechLabel>
          ) : null}
          {article.author ? (
            <TechLabel>
              {strings.writtenBy} {article.author}
            </TechLabel>
          ) : null}
          <DataTicks count={14} className="ms-auto h-3" />
        </div>
      </Container>

      {article.coverImage ? (
        <Container className="pb-12">
          <Reveal from="blur">
            <figure className="overflow-hidden border border-[var(--color-line)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={article.coverImage}
                alt={title}
                className="w-full object-cover"
                fetchPriority="high"
              />
            </figure>
          </Reveal>
        </Container>
      ) : null}

      <Container className="pb-20">
        <div className="max-w-3xl">
          {pick(article.summary, locale) ? (
            <Reveal from="up">
              <p className="text-[clamp(1.05rem,2vw,1.35rem)] leading-relaxed text-offwhite">
                {pick(article.summary, locale)}
              </p>
            </Reveal>
          ) : null}

          <div className="mt-10 space-y-6">
            {body.map((block, index) =>
              block.type === "heading" ? (
                <Reveal key={index} from="up">
                  <h2 className="display pt-4 text-[clamp(1.25rem,2.6vw,1.9rem)]">{block.text}</h2>
                </Reveal>
              ) : (
                <Reveal key={index} from="up">
                  <p className="whitespace-pre-line text-base leading-relaxed text-muted">
                    {block.text}
                  </p>
                </Reveal>
              ),
            )}
          </div>
        </div>
      </Container>

      {related.length > 0 ? (
        <Container as="section" className="border-t border-[var(--color-line)] py-20">
          <TechLabel>{strings.relatedArticles}</TechLabel>
          <div className="mt-8 grid gap-x-8 gap-y-12 md:grid-cols-3">
            {related.map((row) => (
              <ArticleCard
                key={row.id}
                article={row}
                locale={locale}
                ctaLabel={strings.readArticle}
              />
            ))}
          </div>
        </Container>
      ) : null}

      <Container as="section" className="border-t border-[var(--color-line)] py-20 text-center">
        <h2 className="display text-[clamp(1.75rem,4.5vw,3rem)]">{copy("contact.heading")}</h2>
        <Link
          href="/contact"
          className="btn-shine btn-accent mt-8 inline-block rounded-full px-8 py-3.5 text-xs font-medium uppercase tracking-[0.18em]"
        >
          {strings.startProject}
        </Link>
      </Container>
    </article>
  );
}
