import { AlertTriangle, ArrowRight, Sprout } from "lucide-react";
import Link from "next/link";

import { getAdminStrings } from "@/i18n/admin";
import { getAdminLocale } from "@/lib/admin-locale";
import { adminCollections, collectionLabel } from "@/lib/cms/collections";
import { listAdmin } from "@/lib/cms/admin";
import { seedStarterContentAction } from "@/app/admin/actions";
import { emptySeedCollections } from "@/lib/cms/seed";
import { getStore } from "@/lib/cms/store";
import type { Inquiry } from "@/lib/cms/types";

export default async function AdminHome({
  searchParams,
}: {
  searchParams: Promise<{ seeded?: string }>;
}) {
  const { seeded } = await searchParams;
  const store = await getStore();
  const missing = await emptySeedCollections(store);
  const counts = await Promise.all(
    adminCollections.map(async (config) => {
      // A table not created yet (older schema) counts as empty, not a crash.
      const rows = (await store.list(config.name).catch(() => [])) as { published?: boolean }[];
      return {
        config,
        total: rows.length,
        published: rows.filter((row) => row.published !== false).length,
      };
    }),
  );

  const [inquiries, locale] = await Promise.all([
    listAdmin("inquiries") as Promise<Inquiry[]>,
    getAdminLocale(),
  ]);
  const t = getAdminStrings(locale);
  const recent = [...inquiries].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const projects = counts.find((entry) => entry.config.name === "projects");
  const sectionLabel = (name: string) => {
    const config = adminCollections.find((entry) => entry.name === name);
    if (config) return collectionLabel(config, locale);
    if (name === "site_settings") return t.navSettings;
    if (name === "site_content") return t.navContent;
    if (name === "chatbot") return t.navChatbot;
    return name;
  };

  return (
    <div className="space-y-10">
      <header>
        <p className="label">{t.groupOverview}</p>
        <h1 className="display mt-2 text-3xl">{t.dashboardTitle}</h1>
        <p className="mt-2 text-sm text-muted">{t.dashboardIntro}</p>
      </header>

      {seeded ? (
        <p className="rounded border border-[var(--color-line)] bg-graphite p-4 text-sm text-emerald-400">
          {t.seeded}
        </p>
      ) : null}

      {missing.length > 0 ? (
        <div className="rounded border border-[var(--color-line)] bg-graphite p-5">
          <p className="flex items-start gap-3 text-sm text-muted">
            <Sprout className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
            {t.emptyDatabase}
          </p>
          <p className="mt-3 text-xs text-dim" data-missing-sections>
            {t.missingStarter}{" "}
            <span className="text-offwhite">
              {missing.map((name) => sectionLabel(name)).join(locale === "ar" ? "، " : ", ")}
            </span>
          </p>
          <form action={seedStarterContentAction} className="mt-4">
            <button
              type="submit"
              className="btn-accent inline-flex items-center gap-2 rounded px-5 py-2.5 text-[0.6875rem] font-medium uppercase tracking-[0.12em]"
            >
              {t.loadStarterContent}
            </button>
          </form>
        </div>
      ) : null}

      {!store.writable ? (
        <p className="flex items-start gap-3 rounded border border-[var(--color-line)] bg-graphite p-4 text-sm text-muted">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
          {t.notWritable}
        </p>
      ) : null}

      {projects && projects.total === 0 ? (
        <p className="rounded border border-[var(--color-line)] bg-graphite p-4 text-sm text-muted">
          {t.noProjects}{" "}
          <Link href="/admin/projects/new" className="text-accent underline">
            {t.createFirstProject}
          </Link>
        </p>
      ) : null}

      <section>
        <h2 className="admin-label">{t.collections}</h2>
        <ul className="mt-3 grid gap-px border border-[var(--color-line)] bg-[var(--color-line)] sm:grid-cols-2 lg:grid-cols-4">
          {counts.map(({ config, total, published }) => (
            <li key={config.name} className="bg-void">
              <Link href={`/admin/${config.name}`} className="group block p-5">
                <p className="admin-label">{collectionLabel(config, locale)}</p>
                <p className="mt-2 text-3xl font-semibold tabular-nums">{total}</p>
                <p className="mt-1 text-xs text-dim">
                  {config.readOnly ? t.recordsCount : `${published} ${t.publishedCount}`}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-[0.6875rem] uppercase tracking-[0.14em] text-muted transition-colors group-hover:text-accent">
                  {t.manage}
                  <ArrowRight className="h-3 w-3" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="admin-label">{t.latestInquiries}</h2>
        {recent.length === 0 ? (
          <p className="mt-3 rounded border border-[var(--color-line)] p-5 text-sm text-dim">
            {t.noInquiries}
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-[var(--color-line)] rounded border border-[var(--color-line)]">
            {recent.map((inquiry) => (
              <li key={inquiry.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 p-4">
                <Link href={`/admin/inquiries/${inquiry.id}`} className="text-sm hover:text-accent">
                  {inquiry.name}
                </Link>
                <span className="text-xs text-dim">{inquiry.email}</span>
                {inquiry.service ? (
                  <span className="rounded border border-[var(--color-line)] px-2 py-0.5 text-[0.625rem] uppercase tracking-[0.12em] text-muted">
                    {inquiry.service}
                  </span>
                ) : null}
                <span className="ms-auto text-[0.6875rem] text-dim">
                  {new Date(inquiry.createdAt).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="admin-label">{t.dataLayer}</h2>
        <p className="mt-3 text-sm text-muted">
          {t.activeAdapter} <span className="text-offwhite">{store.kind}</span>
          {store.kind === "json" ? t.jsonNote : t.supabaseNote}
        </p>
      </section>
    </div>
  );
}

export const dynamic = "force-dynamic";
