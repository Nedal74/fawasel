import { Star, StarOff, Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteConversationAction, setConversationLeadAction } from "@/app/admin/growth-actions";
import { ConfirmButton } from "@/components/admin/growth/ConfirmButton";
import { getAdminStrings } from "@/i18n/admin";
import { getAdminLocale } from "@/lib/admin-locale";
import { sourceName } from "@/lib/tracking/labels";
import { getTrackingStore } from "@/lib/tracking/store";

export const dynamic = "force-dynamic";

const button =
  "inline-flex items-center gap-2 rounded border border-[var(--color-line)] px-3 py-2 text-[0.6875rem] uppercase tracking-[0.12em] text-muted transition-colors hover:text-offwhite";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await getAdminLocale();
  const t = getAdminStrings(locale);
  const conversation = await (await getTrackingStore()).getConversation(id).catch(() => null);
  if (!conversation) notFound();

  const date = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", { dateStyle: "medium", timeStyle: "short" });
  const time = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", { timeStyle: "short" });
  const deviceNames: Record<string, string> = { mobile: t.deviceMobile, tablet: t.deviceTablet, desktop: t.deviceDesktop };

  const meta = [
    { label: t.dateColumn, value: date.format(new Date(conversation.createdAt)) },
    { label: t.startedOn, value: conversation.page, ltr: true },
    { label: t.leadSource, value: sourceName(conversation.source, locale) },
    { label: t.languageLabel, value: conversation.locale === "ar" ? "العربية" : "English" },
    { label: t.deviceLabel, value: deviceNames[conversation.device] ?? conversation.device },
  ];

  return (
    <div className="max-w-3xl">
      <Link href="/admin/conversations" className="label hover:text-offwhite">
        ← {t.backToConversations}
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="display text-3xl">{date.format(new Date(conversation.createdAt))}</h1>
        {conversation.isLead ? (
          <span className="rounded-full bg-accent px-2.5 py-1 text-[0.625rem] font-medium uppercase tracking-[0.12em] text-accent-ink">
            {t.leadBadge}
          </span>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <ConfirmButton
          action={setConversationLeadAction.bind(null, conversation.id, !conversation.isLead)}
          label={conversation.isLead ? t.unmarkLead : t.markLead}
          className={button}
        >
          {conversation.isLead ? <StarOff className="h-3.5 w-3.5" aria-hidden /> : <Star className="h-3.5 w-3.5" aria-hidden />}
          {conversation.isLead ? t.unmarkLead : t.markLead}
        </ConfirmButton>
        <ConfirmButton
          action={deleteConversationAction.bind(null, conversation.id, true)}
          confirmText={t.deleteConversationConfirm}
          label={t.delete}
          className={`${button} hover:border-accent hover:text-accent`}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          {t.delete}
        </ConfirmButton>
      </div>

      <section className="mt-8">
        <h2 className="admin-label">{t.conversationMeta}</h2>
        <dl className="mt-3 grid gap-px border border-[var(--color-line)] bg-[var(--color-line)] sm:grid-cols-2">
          {meta.map((item) => (
            <div key={item.label} className="bg-void p-4">
              <dt className="text-[0.6875rem] uppercase tracking-[0.14em] text-dim">{item.label}</dt>
              <dd className="mt-1 text-sm" dir={item.ltr ? "ltr" : undefined}>
                {item.value || "—"}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-8">
        <h2 className="admin-label">{t.transcript}</h2>
        <ol className="mt-3 space-y-3 rounded border border-[var(--color-line)] p-4" dir={conversation.locale === "ar" ? "rtl" : "ltr"}>
          {conversation.messages.map((message, index) => (
            <li key={index} className={`flex ${message.from === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  message.from === "user"
                    ? message.kind === "text"
                      ? "rounded-ee-sm border border-accent text-offwhite"
                      : "rounded-ee-sm bg-accent text-accent-ink"
                    : message.kind === "fallback"
                      ? "rounded-es-sm border border-dashed border-[var(--color-line)] text-muted"
                      : "rounded-es-sm border border-[var(--color-line)] bg-ink"
                }`}
              >
                <p className="whitespace-pre-line break-words">{message.text}</p>
                <p className={`mt-1 text-[0.625rem] ${message.from === "user" && message.kind !== "text" ? "text-accent-ink/70" : "text-dim"}`}>
                  {message.from === "user" ? t.visitorLabel : t.botLabel} · {time.format(new Date(message.at))}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
