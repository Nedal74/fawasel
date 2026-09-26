import { BookOpen, CircleHelp } from "lucide-react";
import Link from "next/link";

import { ChatbotEditor } from "@/components/admin/growth/ChatbotEditor";
import { getAdminStrings } from "@/i18n/admin";
import { getAdminLocale } from "@/lib/admin-locale";
import { getChatbot } from "@/lib/cms/queries";

export const dynamic = "force-dynamic";

export default async function ChatbotPage() {
  const [config, locale] = await Promise.all([getChatbot(), getAdminLocale()]);
  const t = getAdminStrings(locale);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, createdAt, updatedAt, ...editable } = config;

  return (
    <div>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">{t.groupGrowth}</p>
          <h1 className="display mt-2 text-3xl">{t.chatbotTitle}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">{t.chatbotIntro}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/chat_knowledge"
            className="inline-flex items-center gap-2 rounded border border-[var(--color-line)] px-3 py-2 text-[0.6875rem] uppercase tracking-[0.12em] text-muted hover:text-offwhite"
          >
            <BookOpen className="h-3.5 w-3.5" aria-hidden />
            {t.navKnowledge}
          </Link>
          <Link
            href="/admin/unanswered"
            className="inline-flex items-center gap-2 rounded border border-[var(--color-line)] px-3 py-2 text-[0.6875rem] uppercase tracking-[0.12em] text-muted hover:text-offwhite"
          >
            <CircleHelp className="h-3.5 w-3.5" aria-hidden />
            {t.navUnanswered}
          </Link>
        </div>
      </header>
      <ChatbotEditor initial={editable} t={t} />
    </div>
  );
}
