import "server-only";

import { pick } from "@/lib/locale";
import type { ChatKnowledge, Locale } from "@/lib/cms/types";

import { bestMatch } from "./match";

export type AnswerInput = {
  question: string;
  locale: Locale;
  knowledge: ChatKnowledge[];
  synonyms: string[];
};

export type AnswerResult =
  | { found: true; text: string; entryId: string; confidence: number }
  | { found: false };

/**
 * Anything that can answer a visitor's free-text question.
 *
 * The chat API only ever talks to this interface, so adding an AI model later
 * means writing one more implementation and returning it from
 * `getAnswerProvider()` — nothing else changes (logging, unanswered questions,
 * lead capture and the widget all stay the same).
 */
export interface AnswerProvider {
  readonly name: string;
  answer(input: AnswerInput): Promise<AnswerResult>;
}

/** Free, offline provider: text matching against the dashboard's knowledge base. */
export const keywordProvider: AnswerProvider = {
  name: "keyword",
  async answer({ question, locale, knowledge, synonyms }) {
    const entries = knowledge.map((entry) => ({
      id: entry.id,
      texts: [entry.question.en, entry.question.ar],
      keywords: entry.keywords ?? [],
    }));
    const match = bestMatch(question, entries, synonyms);
    if (!match) return { found: false };
    const entry = knowledge.find((row) => row.id === match.id);
    const text = entry ? pick(entry.answer, locale) : "";
    if (!text) return { found: false };
    return { found: true, text, entryId: match.id, confidence: match.score };
  },
};

/**
 * THE switch point for the chatbot's brain.
 *
 * To plug in an AI provider later: implement `AnswerProvider` (e.g. in
 * `providers/ai.ts`, reading its API key from a server-only env var), then
 * return it here, e.g.
 *
 *   if (process.env.CHATBOT_PROVIDER === "ai") return aiProvider;
 *
 * A good AI provider still receives `knowledge` so it answers from the
 * dashboard's content, and can fall back to `keywordProvider` on errors.
 */
export function getAnswerProvider(): AnswerProvider {
  return keywordProvider;
}
