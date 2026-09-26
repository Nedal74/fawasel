import { AlertTriangle, ArrowDownRight, ArrowUpRight, Check, MessagesSquare, RotateCcw, Trash2 } from "lucide-react";
import Link from "next/link";

import { deleteLeadAction, setLeadHandledAction } from "@/app/admin/growth-actions";
import { BarList } from "@/components/admin/growth/BarList";
import { ConfirmButton } from "@/components/admin/growth/ConfirmButton";
import { VisitsChart } from "@/components/admin/growth/VisitsChart";
import { getAdminStrings, type AdminStrings } from "@/i18n/admin";
import { getAdminLocale } from "@/lib/admin-locale";
import type { Locale } from "@/lib/cms/types";
import { countryName, placementName, sourceName } from "@/lib/tracking/labels";
import { computeStats, parseRange, sinceFor, type RangeKey, type Stats } from "@/lib/tracking/stats";
import { getTrackingStore } from "@/lib/tracking/store";
import type { Lead } from "@/lib/tracking/types";
import { whatsappLink } from "@/lib/utils";

export const dynamic = "force-dynamic";

const iconButton =
  "inline-flex h-8 w-8 items-center justify-center rounded border border-[var(--color-line)] text-dim transition-colors hover:text-offwhite";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range: rawRange } = await searchParams;
  const range = parseRange(rawRange);
  const locale = await getAdminLocale();
  const t = getAdminStrings(locale);

  let stats: Stats | null = null;
  let leads: Lead[] = [];
  try {
    const store = await getTrackingStore();
    const [events, leadRows] = await Promise.all([store.listEvents(sinceFor(range)), store.listLeads(100)]);
    stats = computeStats(events, range);
    leads = leadRows;
  } catch (error) {
    console.warn("[analytics]", error instanceof Error ? error.message : error);
  }

  const ranges: { key: RangeKey; label: string }[] = [
    { key: "today", label: t.rangeToday },
    { key: "7d", label: t.range7d },
    { key: "30d", label: t.range30d },
  ];

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">{t.groupGrowth}</p>
          <h1 className="display mt-2 text-3xl">{t.analyticsTitle}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">{t.analyticsIntro}</p>
        </div>
        <nav className="flex gap-1.5" aria-label={t.analyticsTitle}>
          {ranges.map((item) => (
            <Link
              key={item.key}
              href={`/admin/analytics?range=${item.key}`}
              aria-current={item.key === range ? "page" : undefined}
              className={`rounded border px-3 py-1.5 text-[0.6875rem] uppercase tracking-[0.12em] ${
                item.key === range ? "border-accent text-offwhite" : "border-[var(--color-line)] text-muted hover:text-offwhite"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      {!stats ? (
        <p className="flex items-start gap-3 rounded border border-[var(--color-line)] bg-graphite p-4 text-sm text-muted">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
          {t.trackingUnavailable}
        </p>
      ) : (
        <StatsView stats={stats} t={t} locale={locale} />
      )}

      <LeadsTable leads={leads} t={t} locale={locale} />
    </div>
  );
}

function StatsView({ stats, t, locale }: { stats: Stats; t: AdminStrings; locale: Locale }) {
  const { totals, previous } = stats;
  const conversions = totals.forms + totals.whatsapp + totals.chats + totals.chatLeads;
  const previousConversions = previous.forms + previous.whatsapp + previous.chats + previous.chatLeads;
  const numberFormat = new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-GB");
  const percent = new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    style: "percent",
    maximumFractionDigits: 1,
  });

  const dateLabel = (key: string) =>
    stats.seriesUnit === "hour"
      ? `${key}:00`
      : new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(
          new Date(`${key}T12:00:00Z`),
        );
  const points = stats.series.map((point) => ({ ...point, label: dateLabel(point.key) }));

  const tiles = [
    { label: t.kpiVisits, help: t.kpiVisitsHelp, value: numberFormat.format(totals.pageviews), now: totals.pageviews, before: previous.pageviews },
    { label: t.kpiSessions, help: t.kpiSessionsHelp, value: numberFormat.format(totals.sessions), now: totals.sessions, before: previous.sessions },
    { label: t.kpiConversions, help: `${t.convForms} · ${t.convWhatsapp} · ${t.convChats}`, value: numberFormat.format(conversions), now: conversions, before: previousConversions },
    { label: t.kpiConversionRate, help: t.kpiConversionRateHelp, value: percent.format(totals.conversionRate), now: totals.conversionRate, before: previous.conversionRate },
  ];

  const deviceNames: Record<string, string> = { mobile: t.deviceMobile, tablet: t.deviceTablet, desktop: t.deviceDesktop };
  const languageNames: Record<string, string> = { en: "English", ar: "العربية" };

  return (
    <>
      <section aria-label={t.kpiVisits}>
        <ul className="grid gap-px border border-[var(--color-line)] bg-[var(--color-line)] sm:grid-cols-2 lg:grid-cols-4">
          {tiles.map((tile) => (
            <li key={tile.label} className="bg-void p-5">
              <p className="admin-label">{tile.label}</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums" data-kpi={tile.label}>
                {tile.value}
              </p>
              <p className="mt-1 text-xs text-dim">{tile.help}</p>
              <Delta now={tile.now} before={tile.before} label={t.vsPrevious} locale={locale} />
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded border border-[var(--color-line)] p-5">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="admin-label">
            {t.chartTitle} <span className="normal-case text-dim">· {stats.seriesUnit === "hour" ? t.chartHourly : t.chartDaily}</span>
          </h2>
        </div>
        <VisitsChart points={points} visitsLabel={t.visitsColumn} sessionsLabel={t.sessionsColumn} emptyLabel={t.chartEmpty} />
        <details className="mt-5 text-sm">
          <summary className="cursor-pointer text-[0.6875rem] uppercase tracking-[0.14em] text-muted hover:text-offwhite">{t.tableView}</summary>
          <div className="mt-3 max-h-72 overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-line)]">
                  <th className="admin-label p-2 text-start">{t.dateColumn}</th>
                  <th className="admin-label p-2 text-end">{t.visitsColumn}</th>
                  <th className="admin-label p-2 text-end">{t.sessionsColumn}</th>
                </tr>
              </thead>
              <tbody>
                {points.map((point) => (
                  <tr key={point.key} className="border-b border-[var(--color-line)] last:border-0">
                    <td className="p-2 text-muted">{point.label}</td>
                    <td className="p-2 text-end tabular-nums">{point.pageviews}</td>
                    <td className="p-2 text-end tabular-nums">{point.sessions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>

      <section>
        <h2 className="admin-label">{t.conversionsTitle}</h2>
        <ul className="mt-3 grid gap-px border border-[var(--color-line)] bg-[var(--color-line)] sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: t.convForms, value: totals.forms },
            { label: t.convWhatsapp, value: totals.whatsapp },
            { label: t.convChats, value: totals.chats },
            { label: t.convChatLeads, value: totals.chatLeads },
          ].map((item) => (
            <li key={item.label} className="bg-void p-5">
              <p className="admin-label">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">{numberFormat.format(item.value)}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={t.topPages}>
          <BarList
            emptyLabel={t.noData}
            rows={stats.pages.map((row) => ({ key: row.key, label: row.key, count: row.count }))}
          />
        </Panel>
        <Panel title={t.sourcesTitle}>
          <BarList
            emptyLabel={t.noData}
            rows={stats.sources.map((row) => ({ key: row.key, label: sourceName(row.key, locale), count: row.count }))}
          />
          <p className="mt-4 text-xs leading-relaxed text-dim">{t.utmHint}</p>
        </Panel>
        <Panel title={t.devicesTitle}>
          <BarList
            emptyLabel={t.noData}
            rows={stats.devices.map((row) => ({ key: row.key, label: deviceNames[row.key] ?? row.key, count: row.count }))}
          />
        </Panel>
        <Panel title={t.languagesTitle}>
          <BarList
            emptyLabel={t.noData}
            rows={stats.locales.map((row) => ({ key: row.key, label: languageNames[row.key] ?? row.key, count: row.count }))}
          />
        </Panel>
        <Panel title={t.countriesTitle}>
          <BarList
            emptyLabel={t.noData}
            rows={stats.countries.map((row) => ({ key: row.key, label: countryName(row.key, locale), count: row.count }))}
          />
        </Panel>
        <Panel title={t.whatsappPlacements}>
          <BarList
            emptyLabel={t.noData}
            rows={stats.whatsappPlacements.map((row) => ({ key: row.key, label: placementName(row.key, locale), count: row.count }))}
          />
        </Panel>
      </div>
    </>
  );
}

function Delta({ now, before, label, locale }: { now: number; before: number; label: string; locale: Locale }) {
  if (!before) return <p className="mt-3 text-[0.6875rem] text-dim">—</p>;
  const change = (now - before) / before;
  const up = change >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  const formatted = new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    style: "percent",
    maximumFractionDigits: 0,
    signDisplay: "exceptZero",
  }).format(change);
  return (
    <p className="mt-3 flex items-center gap-1 text-[0.6875rem] text-muted">
      <Icon className="h-3.5 w-3.5" aria-hidden />
      <span className="tabular-nums text-offwhite">{formatted}</span> {label}
    </p>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded border border-[var(--color-line)] p-5">
      <h2 className="admin-label mb-4">{title}</h2>
      {children}
    </section>
  );
}

function LeadsTable({ leads, t, locale }: { leads: Lead[]; t: AdminStrings; locale: Locale }) {
  const date = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <section id="leads">
      <h2 className="admin-label">{t.leadsTitle}</h2>
      <p className="mt-1 text-sm text-dim">{t.leadsIntro}</p>
      <div className="mt-3 overflow-x-auto rounded border border-[var(--color-line)]">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-[var(--color-line)]">
              <th className="admin-label p-3 text-start">{t.leadName}</th>
              <th className="admin-label p-3 text-start">{t.leadPhone}</th>
              <th className="admin-label p-3 text-start">{t.leadPage}</th>
              <th className="admin-label p-3 text-start">{t.leadSource}</th>
              <th className="admin-label p-3 text-start">{t.leadOrigin}</th>
              <th className="admin-label p-3 text-start">{t.dateColumn}</th>
              <th className="admin-label p-3 text-end">{t.actionsColumn}</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-sm text-dim">
                  {t.noLeads}
                </td>
              </tr>
            ) : null}
            {leads.map((lead) => (
              <tr key={lead.id} className={`border-b border-[var(--color-line)] last:border-0 ${lead.handled ? "opacity-60" : ""}`}>
                <td className="p-3">
                  <p>{lead.name}</p>
                  {lead.message ? (
                    <p className="mt-0.5 max-w-xs truncate text-xs text-dim" title={lead.message}>
                      {lead.message}
                    </p>
                  ) : null}
                </td>
                <td className="p-3">
                  <a href={whatsappLink(lead.phone)} target="_blank" rel="noreferrer noopener" dir="ltr" className="hover:text-accent">
                    {lead.phone}
                  </a>
                  {lead.email ? <p className="text-xs text-dim">{lead.email}</p> : null}
                </td>
                <td className="p-3 text-muted" dir="ltr">
                  {lead.page}
                </td>
                <td className="p-3 text-muted">{sourceName(lead.source, locale)}</td>
                <td className="p-3 text-muted">
                  {lead.origin === "chatbot" ? t.originChatbot : t.originContact}
                  {lead.conversationId ? (
                    <Link href={`/admin/conversations/${lead.conversationId}`} className="ms-2 inline-flex items-center gap-1 text-xs text-accent hover:underline">
                      <MessagesSquare className="h-3 w-3" aria-hidden />
                      {t.viewConversation}
                    </Link>
                  ) : null}
                </td>
                <td className="p-3 text-xs text-dim">{date.format(new Date(lead.createdAt))}</td>
                <td className="p-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <ConfirmButton
                      action={setLeadHandledAction.bind(null, lead.id, !lead.handled)}
                      label={lead.handled ? t.markOpen : t.markHandled}
                      className={iconButton}
                    >
                      {lead.handled ? <RotateCcw className="h-3.5 w-3.5" aria-hidden /> : <Check className="h-3.5 w-3.5" aria-hidden />}
                    </ConfirmButton>
                    <ConfirmButton
                      action={deleteLeadAction.bind(null, lead.id)}
                      confirmText={t.deleteLeadConfirm}
                      label={t.delete}
                      className={`${iconButton} hover:border-accent hover:text-accent`}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </ConfirmButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
