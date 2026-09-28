import type { Locale } from "@/lib/cms/types";
import { jsonLd } from "@/lib/seo";
import { buildStructuredData } from "@/lib/structured-data";

/** The one JSON-LD block on every public page (see src/lib/structured-data.ts). */
export async function StructuredData({ path, locale }: { path: string; locale: Locale }) {
  const graph = await buildStructuredData(path, locale);
  if (!graph) return null;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(graph) }} />;
}
