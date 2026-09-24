import { Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { RowActions } from "@/components/admin/RowActions";
import { getAdminStrings } from "@/i18n/admin";
import { getAdminLocale } from "@/lib/admin-locale";
import { docLabel, listAdmin } from "@/lib/cms/admin";
import {
  collectionLabel,
  collectionSingular,
  columnLabel,
  getCollectionConfig,
} from "@/lib/cms/collections";

type Props = {
  params: Promise<{ collection: string }>;
  searchParams: Promise<{ q?: string; status?: string }>;
};

export const dynamic = "force-dynamic";

export default async function CollectionPage({ params, searchParams }: Props) {
  const { collection } = await params;
  const { q = "", status = "" } = await searchParams;
  const config = getCollectionConfig(collection);
  if (!config) notFound();

  const [rowsRaw, locale] = await Promise.all([listAdmin(config.name), getAdminLocale()]);
  const rows = rowsRaw as unknown as Record<string, unknown>[];
  const t = getAdminStrings(locale);
  const label = collectionLabel(config, locale);
  const singular = collectionSingular(config, locale);
  const supportsPublish = config.fields.some((field) => field.name === "published");
  const supportsOrder = config.fields.some((field) => field.name === "order");

  const needle = q.trim().toLowerCase();
  const filtered = rows.filter((row) => {
    if (status === "published" && row.published === false) return false;
    if (status === "draft" && row.published !== false) return false;
    if (!needle) return true;
    return JSON.stringify(row).toLowerCase().includes(needle);
  });

  const statusFilters = [
    { value: "", label: t.filterAll },
    { value: "published", label: t.filterPublished },
    { value: "draft", label: t.filterDraft },
  ];

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">{config.readOnly ? t.recordsLabel : t.collection}</p>
          <h1 className="display mt-2 text-3xl">{label.toUpperCase()}</h1>
          <p className="mt-2 text-sm text-dim">
            {filtered.length} {t.ofRecords} {rows.length} {t.recordsSuffix}
          </p>
        </div>
        {config.readOnly ? null : (
          <Link
            href={`/admin/${config.name}/new`}
            className="inline-flex items-center gap-2 rounded btn-accent px-5 py-2.5 text-[0.6875rem] font-medium uppercase tracking-[0.12em]"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            {t.newRecord} {singular.toLowerCase()}
          </Link>
        )}
      </header>

      <form className="mt-6 flex flex-wrap items-center gap-3" role="search">
        <label className="sr-only" htmlFor="q">
          {t.search} {label}
        </label>
        <input
          id="q"
          name="q"
          defaultValue={q}
          placeholder={`${t.search} ${label.toLowerCase()}…`}
          className="admin-input max-w-xs"
        />
        {supportsPublish ? (
          <div className="flex gap-1.5">
            {statusFilters.map((filter) => (
              <button
                key={filter.value || "all"}
                type="submit"
                name="status"
                value={filter.value}
                className={`rounded border px-3 py-1.5 text-[0.6875rem] uppercase tracking-[0.12em] ${
                  status === filter.value
                    ? "border-accent text-offwhite"
                    : "border-[var(--color-line)] text-muted"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        ) : (
          <button
            type="submit"
            className="rounded border border-[var(--color-line)] px-3 py-1.5 text-[0.6875rem] uppercase tracking-[0.12em] text-muted"
          >
            {t.search}
          </button>
        )}
      </form>

      <div className="mt-6 overflow-x-auto rounded border border-[var(--color-line)]">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-[var(--color-line)] text-start">
              <th className="admin-label p-3 text-start">{singular}</th>
              {config.columns?.map((column) => (
                <th key={column.field} className="admin-label p-3 text-start">
                  {columnLabel(column, locale)}
                </th>
              ))}
              {supportsPublish ? <th className="admin-label p-3 text-start">{t.statusColumn}</th> : null}
              <th className="admin-label p-3 text-end">{t.actionsColumn}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-sm text-dim">
                  {t.noRecords}
                </td>
              </tr>
            ) : null}
            {filtered.map((row) => {
              const id = String(row.id);
              const published = row.published !== false;
              return (
                <tr key={id} className="border-b border-[var(--color-line)] last:border-0">
                  <td className="p-3">
                    <Link href={`/admin/${config.name}/${id}`} className="hover:text-accent">
                      {docLabel(row, config.titleField) || t.untitled}
                    </Link>
                  </td>
                  {config.columns?.map((column) => (
                    <td key={column.field} className="p-3 text-muted">
                      {docLabel(row, column.field)}
                    </td>
                  ))}
                  {supportsPublish ? (
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.625rem] uppercase tracking-[0.12em] ${
                          published
                            ? "border-emerald-500/40 text-emerald-400"
                            : "border-[var(--color-line)] text-dim"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            published ? "bg-emerald-400" : "bg-dim"
                          }`}
                          aria-hidden
                        />
                        {published ? t.filterPublished : t.filterDraft}
                      </span>
                    </td>
                  ) : null}
                  <td className="p-3">
                    <RowActions
                      collection={config.name}
                      id={id}
                      published={published}
                      supportsPublish={supportsPublish}
                      supportsOrder={supportsOrder}
                      t={t}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
