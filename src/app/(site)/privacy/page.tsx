import type { Metadata } from "next";

import { PageHeader } from "@/components/public/PageHeader";
import { Container } from "@/components/ui/Container";
import { getContentMap } from "@/lib/cms/queries";
import { getLocale, makeCopy } from "@/lib/i18n";
import { parseArticleBody } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const [content, locale] = await Promise.all([getContentMap(), getLocale()]);
  const copy = makeCopy(content, locale);
  return { title: copy("privacy.heading"), description: copy("privacy.intro") };
}

/** Renders **bold** runs inside a CMS paragraph; everything else is text. */
function withBold(text: string) {
  return text.split(/\*\*(.+?)\*\*/g).map((part, index) =>
    index % 2 === 1 ? (
      <strong key={index} className="font-semibold text-offwhite">
        {part}
      </strong>
    ) : (
      part
    ),
  );
}

/** Privacy policy. The whole text is editable under Dashboard → Hero & copy → Privacy. */
export default async function PrivacyPage() {
  const locale = await getLocale();
  const copy = makeCopy(await getContentMap(), locale);
  const body = parseArticleBody(copy("privacy.body"));

  return (
    <>
      <PageHeader
        eyebrow={copy("privacy.eyebrow")}
        title={copy("privacy.heading")}
        intro={copy("privacy.intro")}
        meta={copy("privacy.updated")}
      />
      <Container className="pb-24">
        <div className="max-w-3xl space-y-5 text-[0.9375rem] leading-relaxed text-muted">
          {body.map((block, index) =>
            block.type === "heading" ? (
              <h2 key={index} className="pt-6 text-lg font-semibold text-offwhite">
                {block.text}
              </h2>
            ) : (
              <p key={index} className="whitespace-pre-line">
                {withBold(block.text)}
              </p>
            ),
          )}
        </div>
      </Container>
    </>
  );
}
