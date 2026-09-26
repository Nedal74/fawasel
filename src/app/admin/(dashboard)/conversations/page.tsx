import { AlertTriangle, Star, StarOff, Trash2 } from "lucide-react";
import Link from "next/link";

import { deleteConversationAction, setConversationLeadAction } from "@/app/admin/growth-actions";
import { ConfirmButton } from "@/components/admin/growth/ConfirmButton";
import { getAdminStrings } from "@/i18n/admin";
import { getAdminLocale } from "@/lib/admin-locale";
import { sourceName } from "@/lib/tracking/labels";
import { getTrackingStore } from "@/lib/tracking/store";
import type { Conversation } from "@/lib/tracking/types";

export const dynamic = "force-dynamic";

const iconButton =
  "inline-flex h-8 w-8 items-center justify-center rounded border border-[var(--color-line)] text-dim transition-colors hover:text-offwhite";

export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter = "" } = await searchParams;
  const locale = await getAdminLocale();
  const t = getAdminStrings(locale);

  let rows: Conversation[] | null = null;
  try {
    rows = await (await getTrackingStore()).listConversations(300);
  } catch (error) {
    console.warn("[conversations]", error instanceof Error ? error.message : error);
  }
  const visible = (rows ?? []).filter((row) => (filter === "leads" ? row.isLead : true));
  const date = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", { dateStyle: "medium", timeStyle: "short" });

  const filters = [
    { value: "", label: t.filterAll },
    { value: "leads", label: t.filterLeads },
  ];

  return (
    <div>
      <header>
        <p className="label">{t.groupGrowth}</p>
        <h1 className="display mt-2 text-3xl">{t.conversationsTitle}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">{t.conversationsIntro}</p>
      </header>

      <div className="mt-6 flex gap-1.5">
        {filters.map((item) => (
          <Link
            key={item.value || "all"}
            href={item.value ? `/admin/conversations?filter=${item.value}` : "/admin/conversations"}
            className={`rounded border px-3 py-1.5 text-[0.6875rem] uppercase tracking-[0.12em] ${
              filter === item.value ? "border-accent text-offwhite" : "border-[var(--color-line)] text-muted"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {rows === null ? (
        <p className="mt-6 flex items-start gap-3 rounded border border-[var(--color-line)] bg-graphite p-4 text-sm text-muted">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
          {t.trackingUnavailable}
        </p>
      ) : visible.length === 0 ? (
        <p className="mt-6 rounded border border-[var(--color-line)] p-6 text-sm text-dim">{t.noConversations}</p>
      ) : (
        <ul className="mt-6 divide-y divide-[var(--color-line)] rounded border border-[var(--color-line)]">
          {visible.map((row) => {
            const picks = row.messages.filter((message) => message.from === "user").map((message) => message.text);
            return (
              <li key={row.id} className="flex flex-wrap items-start gap-x-4 gap-y-2 p-4" data-conversation={row.id}>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/conversations/${row.id}`} className="text-sm hover:text-accent">
                      {date.format(new Date(row.createdAt))}
                    </Link>
                    {row.isLead ? (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-[0.625rem] font-medium uppercase tracking-[0.12em] text-accent-ink">
                        {t.leadBadge}
                      </span>
                    ) : null}
                    {row.outcome ? (
                      <span className="rounded-full border border-[var(--color-line)] px-2 py-0.5 text-[0.625rem] uppercase tracking-[0.12em] text-muted">
                        {row.outcome === "lead" ? t.outcomeLead : t.outcomeWhatsapp}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-dim">
                    {t.startedOn} <span dir="ltr">{row.page}</span> · {sourceName(row.source, locale)} ·{" "}
                    {row.locale === "ar" ? "العربية" : "English"} · {row.messages.length} {t.messagesCount}
                  </p>
                  {picks.length ? (
                    <p className="mt-2 line-clamp-2 text-sm text-muted" dir="auto">
                      {picks.slice(0, 6).join("  ›  ")}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-1.5">
                  <ConfirmButton
                    action={setConversationLeadAction.bind(null, row.id, !row.isLead)}
                    label={row.isLead ? t.unmarkLead : t.markLead}
                    className={iconButton}
                  >
                    {row.isLead ? <StarOff className="h-3.5 w-3.5" aria-hidden /> : <Star className="h-3.5 w-3.5" aria-hidden />}
                  </ConfirmButton>
                  <ConfirmButton
                    action={deleteConversationAction.bind(null, row.id, false)}
                    confirmText={t.deleteConversationConfirm}
                    label={t.delete}
                    className={`${iconButton} hover:border-accent hover:text-accent`}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </ConfirmButton>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
