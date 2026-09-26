import Link from "next/link";
import { notFound } from "next/navigation";

import { DocForm } from "@/components/admin/DocForm";
import { getAdminStrings } from "@/i18n/admin";
import { getAdminLocale } from "@/lib/admin-locale";
import { mediaOptions, referenceOptions } from "@/lib/cms/admin";
import {
  collectionLabel,
  collectionSingular,
  emptyValues,
  getCollectionConfig,
} from "@/lib/cms/collections";

export const dynamic = "force-dynamic";

export default async function NewDocPage({
  params,
  searchParams,
}: {
  params: Promise<{ collection: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { collection } = await params;
  const query = await searchParams;
  const config = getCollectionConfig(collection);
  if (!config || config.readOnly) notFound();

  const [references, media, locale] = await Promise.all([
    referenceOptions(),
    mediaOptions(),
    getAdminLocale(),
  ]);
  const t = getAdminStrings(locale);

  return (
    <div>
      <header className="mb-8">
        <Link href={`/admin/${config.name}`} className="label hover:text-offwhite">
          ← {collectionLabel(config, locale)}
        </Link>
        <h1 className="display mt-3 text-3xl">
          {t.newRecord} {collectionSingular(config, locale)}
        </h1>
      </header>
      <DocForm
        collection={config.name}
        id={null}
        fields={config.fields}
        values={prefill(emptyValues(config), config.fields, query)}
        references={references}
        media={media}
        locale={locale}
        t={t}
      />
    </div>
  );
}

/**
 * Pre-fills text fields from the query string, e.g. the "Add answer" link on
 * the unanswered-questions page opens `?question.ar=…`.
 */
function prefill(
  values: Record<string, unknown>,
  fields: { name: string; type: string }[],
  query: Record<string, string | string[] | undefined>,
): Record<string, unknown> {
  const text = (key: string) => {
    const value = query[key];
    return typeof value === "string" ? value.slice(0, 1000) : undefined;
  };
  for (const field of fields) {
    if (field.type === "localized" || field.type === "localizedArea") {
      const current = values[field.name] as { en: string; ar: string };
      values[field.name] = {
        en: text(`${field.name}.en`) ?? current.en,
        ar: text(`${field.name}.ar`) ?? current.ar,
      };
    } else if (field.type === "text" || field.type === "textarea") {
      values[field.name] = text(field.name) ?? values[field.name];
    }
  }
  return values;
}
