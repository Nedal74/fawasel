"use client";

import { ArrowUp, Bot, Loader2, MessageCircle, RotateCcw, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { WhatsAppIcon } from "@/components/ui/BrandIcons";
import type { UiStrings } from "@/i18n/strings";
import type { ChatActionType, ChatbotConfig, Locale } from "@/lib/cms/types";
import { pick } from "@/lib/locale";
import { visitMeta } from "@/lib/track-client";
import { cn, whatsappLink } from "@/lib/utils";

/**
 * Scripted chatbot. The flow (steps + choices) comes from the dashboard and
 * runs here in the browser; free-text questions, logging and lead capture go
 * through /api/chat, where the answer provider lives.
 */

type Message = { id: number; from: "bot" | "user"; text: string; kind: LogKind };
type LogKind = "message" | "option" | "text" | "answer" | "fallback" | "system";
type Choice = { id: string; label: string; action: ChatActionType; target: string };
type Mode = "chat" | "lead";

type Saved = {
  conversationId: string | null;
  messages: Message[];
  choices: Choice[];
  mode: Mode;
  interests: string[];
};

const STATE_KEY = "nedal_chat";
const DISMISS_KEY = "nedal_chat_teaser";

function load(): Saved | null {
  try {
    const raw = window.sessionStorage.getItem(STATE_KEY);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
}

function save(state: Saved): void {
  try {
    window.sessionStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {
    // Private mode: the chat just won't survive a reload.
  }
}

export function ChatBot({
  config,
  locale,
  strings,
  whatsapp,
}: {
  config: ChatbotConfig;
  locale: Locale;
  strings: UiStrings;
  whatsapp: string;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [teaser, setTeaser] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [mode, setMode] = useState<Mode>("chat");
  const [interests, setInterests] = useState<string[]>([]);
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState("");
  const [input, setInput] = useState("");

  const conversationId = useRef<string | null>(null);
  /** Transcript lines not yet sent to the server. */
  const pending = useRef<{ from: "bot" | "user"; text: string; kind: LogKind }[]>([]);
  /** Serializes API calls so the first one creates the conversation. */
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const nextId = useRef(1);
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const t = (value: { en: string; ar: string }) => pick(value, locale);

  // Show the launcher, then pop the teaser unless this tab already chatted.
  useEffect(() => {
    const saved = load();
    const show = setTimeout(() => setReady(true), 1200);
    let dismissed = false;
    try {
      dismissed = window.sessionStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      // ignore
    }
    const delay = Math.min(60, Math.max(3, config.delaySeconds || 7)) * 1000;
    const pop = dismissed || saved?.messages.length ? undefined : setTimeout(() => setTeaser(true), delay);
    return () => {
      clearTimeout(show);
      if (pop) clearTimeout(pop);
    };
  }, [config.delaySeconds]);

  useEffect(() => {
    if (messages.length === 0) return;
    save({ conversationId: conversationId.current, messages, choices, mode, interests });
  }, [messages, choices, mode, interests]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing, mode]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const say = useCallback((from: "bot" | "user", text: string, kind: LogKind, log = true) => {
    if (!text) return;
    setMessages((current) => [...current, { id: nextId.current++, from, text, kind }]);
    if (log) pending.current.push({ from, text, kind });
  }, []);

  /** Sends pending transcript lines (plus an action) to the server, in order. */
  const call = useCallback(
    (action: "log" | "ask" | "lead" | "outcome", extra: Record<string, unknown> = {}) => {
      const run = async () => {
        const entries = pending.current.splice(0, 30);
        const meta = visitMeta();
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            conversationId: conversationId.current,
            sessionId: meta.sessionId,
            locale,
            page: meta.page,
            source: meta.source,
            entries,
            ...extra,
          }),
        });
        if (!response.ok) throw new Error(`chat ${response.status}`);
        const body = (await response.json()) as {
          conversationId: string | null;
          answer?: { text: string; found: boolean };
        };
        if (body.conversationId) conversationId.current = body.conversationId;
        return body;
      };
      const next = queue.current.then(run, run);
      queue.current = next.catch(() => undefined);
      return next;
    },
    [locale],
  );

  const stepChoices = useCallback(
    (stepId: string): Choice[] => {
      const step = config.steps.find((item) => item.id === stepId);
      return (step?.options ?? []).map((option) => ({
        id: option.id,
        label: t(option.label),
        action: option.action,
        target: option.target,
      }));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config.steps, locale],
  );

  const followUps = useCallback(
    (): Choice[] => [
      { id: "fu-whatsapp", label: strings.chatWhatsapp, action: "whatsapp", target: "" },
      { id: "fu-details", label: strings.chatLeaveDetails, action: "lead", target: "" },
      { id: "fu-menu", label: strings.chatMenu, action: "step", target: config.startStepId },
    ],
    [strings, config.startStepId],
  );

  const showStep = useCallback(
    (stepId: string) => {
      const step =
        config.steps.find((item) => item.id === stepId) ??
        config.steps.find((item) => item.id === config.startStepId) ??
        config.steps[0];
      if (!step) return;
      say("bot", t(step.message), "message");
      setChoices(stepChoices(step.id));
      setMode("chat");
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config.steps, config.startStepId, say, stepChoices, locale],
  );

  function openPanel() {
    setOpen(true);
    setTeaser(false);
    try {
      window.sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
    if (messages.length === 0) {
      // Pick up a conversation from earlier in this tab (e.g. after a reload).
      const saved = load();
      if (saved?.messages.length) {
        conversationId.current = saved.conversationId;
        nextId.current = (saved.messages.at(-1)?.id ?? 0) + 1;
        setMessages(saved.messages);
        setChoices(saved.choices);
        setMode(saved.mode);
        setInterests(saved.interests ?? []);
      } else {
        showStep(config.startStepId);
      }
    }
    setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 250);
  }

  function dismissTeaser() {
    setTeaser(false);
    try {
      window.sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
  }

  function restart() {
    pending.current = [];
    conversationId.current = null;
    setMessages([]);
    setInterests([]);
    setError("");
    try {
      window.sessionStorage.removeItem(STATE_KEY);
    } catch {
      // ignore
    }
    showStep(config.startStepId);
  }

  function whatsappText(): string {
    const lines = [t(config.whatsappMessage)];
    if (interests.length) lines.push(`${strings.chatInterest}: ${interests.slice(-3).join(" · ")}`);
    return lines.join("\n");
  }

  function choose(choice: Choice) {
    setError("");
    say("user", choice.label, "option");
    if (choice.action === "step" && choice.target !== config.startStepId) {
      setInterests((current) => [...current.filter((item) => item !== choice.label), choice.label]);
    }
    switch (choice.action) {
      case "step":
        showStep(choice.target || config.startStepId);
        break;
      case "ask":
        say("bot", t(config.askPrompt), "message");
        setChoices([{ id: "fu-menu", label: strings.chatMenu, action: "step", target: config.startStepId }]);
        inputRef.current?.focus();
        break;
      case "lead":
        say("bot", t(config.leadPrompt), "message");
        setChoices([]);
        setMode("lead");
        break;
      case "whatsapp":
        say("bot", strings.chatOpeningWhatsapp, "system");
        setChoices(followUps().filter((item) => item.action !== "whatsapp"));
        void call("outcome", { outcome: "whatsapp" }).catch(() => undefined);
        return;
      case "link":
        if (choice.target.startsWith("/")) router.push(choice.target);
        else if (choice.target) window.open(choice.target, "_blank", "noopener");
        break;
      case "end":
        say("bot", strings.chatEnded, "message");
        setChoices([{ id: "fu-menu", label: strings.chatMenu, action: "step", target: config.startStepId }]);
        break;
    }
    void call("log").catch(() => undefined);
  }

  async function ask(event: React.FormEvent) {
    event.preventDefault();
    const question = input.trim();
    if (!question || typing) return;
    setInput("");
    setError("");
    setMode("chat");
    // The server logs the question together with its answer.
    say("user", question, "text", false);
    setTyping(true);
    try {
      const body = await call("ask", { question });
      if (body.answer) say("bot", body.answer.text, body.answer.found ? "answer" : "fallback", false);
      setChoices(followUps());
    } catch {
      setError(strings.chatError);
    } finally {
      setTyping(false);
    }
  }

  async function submitLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    const note = String(form.get("note") ?? "").trim();
    if (!name || phone.replace(/\D/g, "").length < 5) {
      setError(strings.formRequired);
      return;
    }
    setError("");
    setTyping(true);
    try {
      await call("lead", {
        lead: { name, phone, note: [note, interests.length ? `${strings.chatInterest}: ${interests.join(", ")}` : ""].filter(Boolean).join(" — ") },
      });
      say("user", `${name} · ${phone}`, "system", false);
      say("bot", t(config.leadThanks), "message");
      setMode("chat");
      setChoices(followUps().filter((item) => item.action !== "lead"));
      void call("log").catch(() => undefined);
    } catch {
      setError(strings.chatError);
    } finally {
      setTyping(false);
    }
  }

  if (!config.enabled || config.steps.length === 0) return null;

  const name = t(config.botName);

  return (
    <>
      {/* Teaser bubble */}
      {teaser && !open ? (
        <div
          className="animate-rise fixed bottom-[9.25rem] end-5 z-[70] w-[min(17rem,calc(100vw-2.5rem))] rounded-2xl rounded-ee-sm border border-[var(--color-line)] bg-ink p-4 text-sm leading-relaxed text-offwhite shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)]"
          role="status"
        >
          <button
            type="button"
            onClick={dismissTeaser}
            aria-label={strings.chatDismiss}
            className="absolute end-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-dim hover:text-offwhite"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
          <button type="button" onClick={openPanel} className="block pe-5 text-start">
            <span className="mb-1 block text-[0.625rem] uppercase tracking-[0.18em] text-accent">{name}</span>
            {t(config.teaser)}
          </button>
        </div>
      ) : null}

      {/* Launcher, stacked above the floating WhatsApp button */}
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openPanel())}
        aria-label={open ? strings.chatClose : strings.chatOpen}
        aria-expanded={open}
        aria-controls="site-chatbot"
        data-chatbot-launcher
        className="fixed bottom-[5.25rem] end-5 z-[70] flex h-12 w-12 items-center justify-center rounded-full border border-[var(--color-line)] bg-ink text-offwhite shadow-[0_18px_40px_-18px_rgba(0,0,0,0.9)] transition-all duration-500 hover:border-accent hover:text-accent"
        style={{ opacity: ready ? 1 : 0, transform: ready ? "none" : "translateY(14px)" }}
      >
        {open ? <X className="h-5 w-5" aria-hidden /> : <MessageCircle className="h-5 w-5" aria-hidden />}
        {teaser && !open ? (
          <span className="absolute -top-0.5 end-0 h-3 w-3 rounded-full border-2 border-void bg-accent" aria-hidden />
        ) : null}
      </button>

      {open ? (
        <div
          id="site-chatbot"
          role="dialog"
          aria-label={name}
          dir={locale === "ar" ? "rtl" : "ltr"}
          lang={locale}
          className="animate-rise fixed inset-x-2 bottom-2 z-[80] flex h-[min(36rem,calc(100dvh-1rem))] flex-col overflow-hidden rounded-2xl border border-[var(--color-line)] bg-void text-offwhite shadow-[0_30px_80px_-30px_rgba(0,0,0,1)] sm:inset-x-auto sm:bottom-[9.25rem] sm:end-5 sm:h-[min(34rem,calc(100dvh-10.5rem))] sm:w-[23rem]"
        >
          <header className="flex items-center gap-3 border-b border-[var(--color-line)] bg-ink px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink">
              <Bot className="h-4.5 w-4.5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{name}</p>
              <p className="flex items-center gap-1.5 text-[0.6875rem] text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
                {strings.chatOnline}
              </p>
            </div>
            <div className="ms-auto flex items-center gap-1">
              <button
                type="button"
                onClick={restart}
                aria-label={strings.chatRestart}
                title={strings.chatRestart}
                className="flex h-8 w-8 items-center justify-center rounded-full text-dim hover:text-offwhite"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={strings.chatClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-dim hover:text-offwhite"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </header>

          <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4" aria-live="polite">
            {messages.map((message) => (
              <div key={message.id} className={cn("flex", message.from === "user" ? "justify-end" : "justify-start")}>
                <p
                  className={cn(
                    "max-w-[85%] whitespace-pre-line break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                    message.from === "user"
                      ? "rounded-ee-sm bg-accent text-accent-ink"
                      : "rounded-es-sm border border-[var(--color-line)] bg-ink text-offwhite",
                  )}
                  data-chat-from={message.from}
                >
                  {message.text}
                </p>
              </div>
            ))}

            {typing ? (
              <p className="flex items-center gap-2 text-xs text-dim">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                {strings.chatTyping}
              </p>
            ) : null}

            {mode === "lead" ? (
              <form onSubmit={submitLead} className="space-y-2.5 rounded-2xl border border-[var(--color-line)] bg-ink p-3.5">
                <label className="sr-only" htmlFor="chat-lead-name">
                  {strings.chatName}
                </label>
                <input
                  id="chat-lead-name"
                  name="name"
                  required
                  maxLength={120}
                  autoComplete="name"
                  placeholder={strings.chatName}
                  className="admin-input text-base sm:text-sm"
                />
                <label className="sr-only" htmlFor="chat-lead-phone">
                  {strings.chatPhone}
                </label>
                <input
                  id="chat-lead-phone"
                  name="phone"
                  type="tel"
                  required
                  maxLength={60}
                  autoComplete="tel"
                  dir="ltr"
                  placeholder={strings.chatPhone}
                  className="admin-input text-base sm:text-sm"
                />
                <label className="sr-only" htmlFor="chat-lead-note">
                  {strings.chatNote}
                </label>
                <input
                  id="chat-lead-note"
                  name="note"
                  maxLength={500}
                  placeholder={strings.chatNote}
                  className="admin-input text-base sm:text-sm"
                />
                <button
                  type="submit"
                  disabled={typing}
                  className="btn-accent w-full rounded-full px-4 py-2.5 text-xs font-medium uppercase tracking-[0.14em] disabled:opacity-60"
                >
                  {strings.chatSubmit}
                </button>
                <p className="text-[0.6875rem] leading-relaxed text-dim">
                  <Link href="/privacy" className="underline hover:text-offwhite">
                    {strings.chatConsent}
                  </Link>
                </p>
              </form>
            ) : null}

            {!typing && choices.length > 0 ? (
              <div className="flex flex-wrap justify-end gap-2 pt-1" role="group">
                {choices.map((choice) =>
                  choice.action === "whatsapp" && whatsapp ? (
                    <a
                      key={choice.id}
                      href={whatsappLink(whatsapp, whatsappText())}
                      target="_blank"
                      rel="noreferrer noopener"
                      data-track-label="chatbot"
                      onClick={() => choose(choice)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-accent/60 px-3.5 py-2 text-start text-xs text-offwhite transition-colors hover:bg-accent hover:text-accent-ink"
                    >
                      <WhatsAppIcon className="h-3.5 w-3.5" />
                      {choice.label}
                    </a>
                  ) : choice.action === "whatsapp" ? null : (
                    <button
                      key={choice.id}
                      type="button"
                      onClick={() => choose(choice)}
                      className="rounded-full border border-[var(--color-line)] px-3.5 py-2 text-start text-xs text-offwhite transition-colors hover:border-accent hover:text-accent"
                    >
                      {choice.label}
                    </button>
                  ),
                )}
              </div>
            ) : null}

            {error ? (
              <p role="alert" className="text-xs text-accent">
                {error}
              </p>
            ) : null}
          </div>

          <form onSubmit={ask} className="flex items-center gap-2 border-t border-[var(--color-line)] bg-ink p-2.5">
            <label className="sr-only" htmlFor="chat-input">
              {strings.chatPlaceholder}
            </label>
            <input
              ref={inputRef}
              id="chat-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={500}
              autoComplete="off"
              placeholder={strings.chatPlaceholder}
              className="min-w-0 flex-1 rounded-full border border-[var(--color-line)] bg-void px-4 py-2.5 text-base text-offwhite placeholder:text-dim focus:border-accent focus:outline-none sm:text-sm"
            />
            <button
              type="submit"
              disabled={!input.trim() || typing}
              aria-label={strings.chatSend}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink disabled:opacity-40"
            >
              <ArrowUp className="h-4 w-4" aria-hidden />
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}
