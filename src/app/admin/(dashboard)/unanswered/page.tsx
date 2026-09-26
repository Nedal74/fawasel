import { AlertTriangle, Check, Plus, RotateCcw, Trash2 } from "lucide-react";
import Link from "next/link";

import { deleteUnansweredAction, setUnansweredResolvedAction } from "@/app/admin/growth-actions";
import { ConfirmButton } from "@/components/admin/growth/ConfirmButton";
import { getAdminStrings } from "@/i18n/admin";
import { getAdminLocale } from "@/lib/admin-locale";
import { normalize } from "@/lib/chatbot/match";
import { getTrackingStore } from "@/lib/tracking/store";
import type { UnansweredQuestion } from "@/lib/tracking/types";

export const dynamic = "force-dynamic";

const iconButton =
  "inline-flex h-8 w-8 items-center justify-center rounded border border-[var(--color-line)] text-dim transition-colors hover:text-offwhite";

type Group = { key: string; question: string; locale: string; items: UnansweredQuestion[] };

export default async function UnansweredPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter = "open" } = await searchParams;
  const locale = await getAdminLocale();
  const t = getAdminStrings(locale);

  let rows: UnansweredQuestion[] | null = null;
  try {
    rows = await (await getTrackingStore()).listUnanswered(1000);
  } catch (error) {
    console.warn("[unanswered]", error instanceof Error ? error.message : error);
  }

  // The same question asked several times shows once, with a count.
  const groups = new Map<string, Group>();
  for (const row of rows ?? []) {
    if (filter === "open" && row.resolved) continue;
    if (filter === "resolved" && !row.resolved) continue;
    const key = normalize(row.question);
    const group = groups.get(key) ?? { key, question: row.question, locale: row.locale, items: [] };
    group.items.push(row);
    groups.set(key, group);
  }
  const list = [...groups.values()];
  const date = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", { dateStyle: "medium" });

  const filters = [
    { value: "open", label: t.filterOpen },
    { value: "resolved", label: t.filterResolved },
    { value: "all", label: t.filterAll },
  ];

  return (
    <div>
      <header>
        <p className="label">{t.groupGrowth}</p>
        <h1 className="display mt-2 text-3xl">{t.unansweredTitle}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">{t.unansweredIntro}</p>
      </header>

      <div className="mt-6 flex gap-1.5">
        {filters.map((item) => (
          <Link
            key={item.value}
            href={`/admin/unanswered?filter=${item.value}`}
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
      ) : list.length === 0 ? (
        <p className="mt-6 rounded border border-[var(--color-line)] p-6 text-sm text-dim">{t.noUnanswered}</p>
      ) : (
        <ul className="mt-6 divide-y divide-[var(--color-line)] rounded border border-[var(--color-line)]">
          {list.map((group) => {
            const ids = group.items.map((item) => item.id);
            const resolved = group.items.every((item) => item.resolved);
            const latest = group.items[0];
            const field = group.locale === "ar" ? "question.ar" : "question.en";
            const addHref = `/admin/chat_knowledge/new?${new URLSearchParams({ [field]: group.question }).toString()}`;
            return (
              <li key={group.key} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4" data-unanswered>
                <div className="min-w-0 flex-1">
                  <p className="text-sm" dir="auto">
                    {group.question}
                  </p>
                  <p className="mt-1 text-xs text-dim">
                    {t.asked} {group.items.length > 1 ? `${group.items.length} ${t.timesAsked} · ` : ""}
                    {date.format(new Date(latest.createdAt))} · <span dir="ltr">{latest.page}</span> ·{" "}
                    {group.locale === "ar" ? "العربية" : "English"}
                    {latest.conversationId ? (
                      <>
                        {" · "}
                        <Link href={`/admin/conversations/${latest.conversationId}`} className="text-accent hover:underline">
                          {t.viewConversation}
                        </Link>
                      </>
                    ) : null}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Link
                    href={addHref}
                    className="inline-flex h-8 items-center gap-1.5 rounded btn-accent px-3 text-[0.6875rem] font-medium uppercase tracking-[0.12em]"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden />
                    {t.addAnswer}
                  </Link>
                  <ConfirmButton
                    action={setUnansweredResolvedAction.bind(null, ids, !resolved)}
                    label={resolved ? t.reopen : t.markResolved}
                    className={iconButton}
                  >
                    {resolved ? <RotateCcw className="h-3.5 w-3.5" aria-hidden /> : <Check className="h-3.5 w-3.5" aria-hidden />}
                  </ConfirmButton>
                  <ConfirmButton
                    action={deleteUnansweredAction.bind(null, ids)}
                    confirmText={t.deleteQuestionConfirm}
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
