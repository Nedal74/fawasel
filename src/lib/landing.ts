import type { KeyMetric, LandingPage, Locale } from "@/lib/cms/types";
import { pick } from "@/lib/locale";

/**
 * Service landing pages keep their repeating blocks (offer items, method
 * steps, questions and answers) as one editable text field per language, so
 * the dashboard needs no bespoke widget and a block stays translatable as a
 * whole. One block per line, with the title and the body separated by "::".
 */

export type LandingBlock = { title: string; body: string };

const SEPARATOR = /\s*(?:::|؛؛)\s*/;

/** Parses the "Title :: description" convention; a line without "::" is a title. */
export function parseBlocks(value: string): LandingBlock[] {
  return value
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title, ...rest] = line.split(SEPARATOR);
      return { title: title.trim(), body: rest.join(" :: ").trim() };
    })
    .filter((block) => block.title.length > 0);
}

export function landingBlocks(field: LandingPage[keyof LandingPage], locale: Locale): LandingBlock[] {
  if (!field || typeof field !== "object" || Array.isArray(field)) return [];
  return parseBlocks(pick(field as { en: string; ar: string }, locale));
}

/** Stats with both a label and a value, in the page language. */
export function landingStats(stats: KeyMetric[], locale: Locale) {
  return (stats ?? [])
    .map((stat) => ({ label: pick(stat.label, locale), value: stat.value?.trim() ?? "" }))
    .filter((stat) => stat.label && stat.value);
}
