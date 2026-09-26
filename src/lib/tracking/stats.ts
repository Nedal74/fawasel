import type { TrackEvent } from "./types";

/**
 * Turns raw events into the dashboard's numbers. Pure, so it runs the same on
 * either adapter.
 */

export type RangeKey = "today" | "7d" | "30d";

export const RANGES: Record<RangeKey, number> = { today: 1, "7d": 7, "30d": 30 };

export function parseRange(value: string | undefined): RangeKey {
  return value === "today" || value === "30d" ? value : "7d";
}

/** Day buckets follow the business's clock, not the server's (UTC on Vercel). */
export const ANALYTICS_TIME_ZONE = process.env.ANALYTICS_TIMEZONE || "Asia/Riyadh";

function dayKey(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function hourKey(date: Date, timeZone: string): number {
  const hour = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", hourCycle: "h23" }).format(date);
  return Number(hour) % 24;
}

/** The last `days` calendar days in `timeZone`, oldest first, ending today. */
export function lastDays(days: number, now: Date, timeZone: string): string[] {
  const keys: string[] = [];
  // 24h hops; the Set drops a duplicate should a DST shift land two on one day.
  for (let i = days - 1; i >= 0; i--) {
    keys.push(dayKey(new Date(now.getTime() - i * 86_400_000), timeZone));
  }
  return [...new Set(keys)];
}

export type Tally = { key: string; count: number };

function tally(values: string[], limit = 10): Tally[] {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
    .slice(0, limit);
}

export type Totals = {
  pageviews: number;
  sessions: number;
  whatsapp: number;
  forms: number;
  chats: number;
  chatLeads: number;
  /** Sessions with at least one conversion. */
  convertedSessions: number;
  conversionRate: number;
};

export type SeriesPoint = { key: string; pageviews: number; sessions: number };

export type Stats = {
  range: RangeKey;
  totals: Totals;
  previous: Totals;
  series: SeriesPoint[];
  seriesUnit: "hour" | "day";
  pages: Tally[];
  sources: Tally[];
  devices: Tally[];
  locales: Tally[];
  countries: Tally[];
  whatsappPlacements: Tally[];
};

const CONVERSIONS = new Set(["whatsapp_click", "form_submit", "chat_start", "chat_lead"]);

function totalsOf(events: TrackEvent[]): Totals {
  const sessions = new Set<string>();
  const converted = new Set<string>();
  const totals = { pageviews: 0, whatsapp: 0, forms: 0, chats: 0, chatLeads: 0 };
  for (const event of events) {
    if (event.type === "pageview") {
      totals.pageviews++;
      sessions.add(event.sessionId);
    }
    if (event.type === "whatsapp_click") totals.whatsapp++;
    if (event.type === "form_submit") totals.forms++;
    if (event.type === "chat_start") totals.chats++;
    if (event.type === "chat_lead") totals.chatLeads++;
    if (CONVERSIONS.has(event.type) && event.sessionId) converted.add(event.sessionId);
  }
  const convertedSessions = [...converted].filter((id) => sessions.has(id)).length;
  return {
    ...totals,
    sessions: sessions.size,
    convertedSessions,
    conversionRate: sessions.size ? convertedSessions / sessions.size : 0,
  };
}

/** How far back to read events so the previous period can be compared too. */
export function sinceFor(range: RangeKey, now = new Date()): string {
  return new Date(now.getTime() - (RANGES[range] * 2 + 1) * 86_400_000).toISOString();
}

export function computeStats(
  events: TrackEvent[],
  range: RangeKey,
  now = new Date(),
  timeZone = ANALYTICS_TIME_ZONE,
): Stats {
  const days = RANGES[range];
  const allDays = lastDays(days * 2, now, timeZone);
  const current = new Set(allDays.slice(-days));
  const previous = new Set(allDays.slice(0, allDays.length - days));

  const inRange: TrackEvent[] = [];
  const before: TrackEvent[] = [];
  for (const event of events) {
    const key = dayKey(new Date(event.createdAt), timeZone);
    if (current.has(key)) inRange.push(event);
    else if (previous.has(key)) before.push(event);
  }

  const pageviews = inRange.filter((event) => event.type === "pageview");

  let series: SeriesPoint[];
  if (range === "today") {
    series = Array.from({ length: 24 }, (_, hour) => ({
      key: String(hour).padStart(2, "0"),
      pageviews: 0,
      sessions: 0,
    }));
    const seen = series.map(() => new Set<string>());
    for (const event of pageviews) {
      const hour = hourKey(new Date(event.createdAt), timeZone);
      series[hour].pageviews++;
      seen[hour].add(event.sessionId);
    }
    series.forEach((point, i) => (point.sessions = seen[i].size));
  } else {
    const index = new Map(allDays.slice(-days).map((key, i) => [key, i]));
    series = allDays.slice(-days).map((key) => ({ key, pageviews: 0, sessions: 0 }));
    const seen = series.map(() => new Set<string>());
    for (const event of pageviews) {
      const i = index.get(dayKey(new Date(event.createdAt), timeZone));
      if (i === undefined) continue;
      series[i].pageviews++;
      seen[i].add(event.sessionId);
    }
    series.forEach((point, i) => (point.sessions = seen[i].size));
  }

  // Session-level breakdowns use each session's landing pageview.
  const landings = new Map<string, TrackEvent>();
  for (const event of pageviews) if (!landings.has(event.sessionId)) landings.set(event.sessionId, event);
  const sessionsList = [...landings.values()];

  return {
    range,
    totals: totalsOf(inRange),
    previous: totalsOf(before),
    series,
    seriesUnit: range === "today" ? "hour" : "day",
    pages: tally(pageviews.map((event) => event.path || "/"), 12),
    sources: tally(sessionsList.map((event) => event.source || "direct"), 10),
    devices: tally(sessionsList.map((event) => event.device || "desktop"), 5),
    locales: tally(sessionsList.map((event) => event.locale || "—"), 5),
    countries: tally(sessionsList.map((event) => event.country || "—"), 8),
    whatsappPlacements: tally(
      inRange.filter((event) => event.type === "whatsapp_click").map((event) => event.label || "site"),
      6,
    ),
  };
}
