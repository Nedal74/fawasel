import type { Metadata } from "next";

import { PageHeader } from "@/components/public/PageHeader";
import { ArticlesSection } from "@/components/public/Sections";
import { getStrings } from "@/i18n/strings";
import { getArticles, getContentMap } from "@/lib/cms/queries";
import { getLocale, makeCopy } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo-pages";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("/articles");
}

export default async function ArticlesPage() {
  const locale = await getLocale();
  const [content, articles] = await Promise.all([getContentMap(), getArticles()]);
  const copy = makeCopy(content, locale);
  const strings = getStrings(locale);

  return (
    <>
      <PageHeader
        eyebrow={copy("articles.eyebrow")}
        title={copy("articles.heading")}
        intro={copy("articles.intro")}
        meta={`${articles.length} ARTICLE${articles.length === 1 ? "" : "S"}`}
      />
      <ArticlesSection
        articles={articles}
        locale={locale}
        copy={copy}
        strings={strings}
        showAllLink={false}
      />
    </>
  );
}
