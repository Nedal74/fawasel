import { NextResponse } from "next/server";
import { z } from "zod";

import { getAnswerProvider } from "@/lib/chatbot/provider";
import { getChatbot, getKnowledge } from "@/lib/cms/queries";
import { getStore } from "@/lib/cms/store";
import { pick } from "@/lib/locale";
import { cleanPath, requestContext } from "@/lib/tracking/request";
import { cleanSource } from "@/lib/tracking/sources";
import { safely, type TrackingStore } from "@/lib/tracking/store";
import type { ChatMessage, Conversation } from "@/lib/tracking/types";

/**
 * Chatbot backend.
 *
 * The scripted flow runs in the browser; this endpoint logs the conversation,
 * answers free-text questions (through the swappable AnswerProvider), records
 * unanswered questions and captures leads. Logging never blocks an answer.
 */

const entry = z.object({
  from: z.enum(["bot", "user"]),
  text: z.string().trim().min(1).max(1200),
  kind: z.enum(["message", "option", "text", "answer", "fallback", "system"]),
});

const schema = z.object({
  action: z.enum(["log", "ask", "lead", "outcome"]),
  conversationId: z.string().uuid().nullable().optional(),
  sessionId: z.string().regex(/^[a-zA-Z0-9_-]{8,64}$/),
  locale: z.enum(["en", "ar"]),
  page: z.string().max(500).optional(),
  source: z.string().max(80).optional(),
  entries: z.array(entry).max(30).optional().default([]),
  question: z.string().trim().min(1).max(500).optional(),
  lead: z
    .object({
      name: z.string().trim().min(1).max(120),
      phone: z.string().trim().min(5).max(60),
      note: z.string().trim().max(1000).optional().default(""),
    })
    .optional(),
  outcome: z.enum(["whatsapp"]).optional(),
});

const MAX_MESSAGES = 300;

function clean(value: string): string {
  return Array.from(value.replace(/<[^>]*>/g, ""))
    .filter((char) => {
      const code = char.codePointAt(0) ?? 0;
      return char === "\n" || (code >= 32 && code !== 127);
    })
    .join("")
    .trim();
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 422 });

  const data = parsed.data;
  const context = await requestContext();
  const page = cleanPath(data.page);
  const source = cleanSource(data.source ?? "direct");
  const now = () => new Date().toISOString();
  const pending: ChatMessage[] = data.entries.map((item) => ({ ...item, text: clean(item.text), at: now() }));

  // Resolve (or lazily open) the conversation this browser tab owns.
  let conversation: Conversation | null = null;
  if (data.conversationId) {
    conversation = await safely("load conversation", (store) => store.getConversation(data.conversationId!));
    if (conversation && conversation.sessionId !== data.sessionId) conversation = null;
  }
  if (!conversation) {
    conversation = await safely("open conversation", async (store) => {
      const created = await store.createConversation({
        sessionId: data.sessionId,
        locale: data.locale,
        page,
        source,
        device: context.device,
        messages: [],
        isLead: false,
        outcome: "",
        leadId: null,
      });
      if (!context.bot && !context.isAdmin) await recordEvent(store, "chat_start", data, page, source, context);
      return created;
    });
  }

  let answer: { text: string; found: boolean } | undefined;
  const patch: Partial<Conversation> = {};

  if (data.action === "ask" && data.question) {
    const question = clean(data.question);
    pending.push({ from: "user", text: question, kind: "text", at: now() });
    const [config, knowledge] = await Promise.all([getChatbot(), getKnowledge()]);
    const result = await getAnswerProvider()
      .answer({ question, locale: data.locale, knowledge, synonyms: config.synonyms })
      .catch(() => ({ found: false as const }));

    if (result.found) {
      answer = { text: result.text, found: true };
      pending.push({ from: "bot", text: result.text, kind: "answer", at: now() });
    } else {
      answer = { text: pick(config.noAnswer, data.locale), found: false };
      pending.push({ from: "bot", text: answer.text, kind: "fallback", at: now() });
      await safely("unanswered", (store) =>
        store.createUnanswered({
          question,
          locale: data.locale,
          page,
          conversationId: conversation?.id ?? null,
          resolved: false,
        }),
      );
    }
  }

  if (data.action === "lead") {
    if (!data.lead) return NextResponse.json({ error: "Validation failed" }, { status: 422 });
    const lead = await safely("chat lead", (store) =>
      store.createLead({
        name: clean(data.lead!.name),
        phone: clean(data.lead!.phone),
        email: "",
        message: clean(data.lead!.note),
        page,
        source,
        origin: "chatbot",
        conversationId: conversation?.id ?? null,
        handled: false,
      }),
    );
    // Mirrored into Inquiries so the lead is kept even if the tracking tables
    // are unavailable, and shows up with the contact-form requests.
    const inquiry = await getStore()
      .then((store) =>
        store.create("inquiries", {
          name: clean(data.lead!.name),
          company: "",
          email: "",
          phone: clean(data.lead!.phone),
          service: "Chatbot",
          budget: "",
          brief: clean(data.lead!.note),
          handled: false,
        }),
      )
      .catch(() => null);
    if (!lead && !inquiry) return NextResponse.json({ error: "Could not save" }, { status: 503 });
    patch.isLead = true;
    patch.outcome = "lead";
    patch.leadId = lead?.id ?? null;
    pending.push({
      from: "user",
      text: `${clean(data.lead.name)} · ${clean(data.lead.phone)}`,
      kind: "system",
      at: now(),
    });
    if (!context.bot && !context.isAdmin) {
      await safely("chat lead event", (store) => recordEvent(store, "chat_lead", data, page, source, context));
    }
  }

  if (data.action === "outcome" && data.outcome === "whatsapp" && conversation?.outcome !== "lead") {
    patch.outcome = "whatsapp";
  }

  if (conversation && (pending.length > 0 || Object.keys(patch).length > 0)) {
    const messages = [...conversation.messages, ...pending].slice(-MAX_MESSAGES);
    await safely("update conversation", (store) =>
      store.updateConversation(conversation!.id, { ...patch, messages }),
    );
  }

  return NextResponse.json({ conversationId: conversation?.id ?? null, answer });
}

function recordEvent(
  store: TrackingStore,
  type: "chat_start" | "chat_lead",
  data: { sessionId: string; locale: string },
  page: string,
  source: string,
  context: { device: "mobile" | "tablet" | "desktop"; country: string },
) {
  return store.recordEvent({
    sessionId: data.sessionId,
    type,
    path: page,
    source,
    referrer: "",
    device: context.device,
    locale: data.locale,
    country: context.country,
    label: "chatbot",
  });
}
