"use client";

import { classifySource, referrerHost } from "@/lib/tracking/sources";

/**
 * Browser half of the first-party analytics.
 *
 * Nothing here uses cookies: the session id and first-touch source live in
 * sessionStorage, so they vanish when the tab closes.
 */

const SESSION_KEY = "nedal_sid";
const SOURCE_KEY = "nedal_src";
const REFERRER_KEY = "nedal_ref";

type Gtag = (...args: unknown[]) => void;

function storage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "");
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

/** Session id + the source the session landed from (computed once per tab). */
export function getVisit(): { sessionId: string; source: string; referrer: string } {
  const store = storage();
  let sessionId = store?.getItem(SESSION_KEY) ?? "";
  let source = store?.getItem(SOURCE_KEY) ?? "";
  let referrer = store?.getItem(REFERRER_KEY) ?? "";
  if (!sessionId) {
    sessionId = randomId();
    const params = new URLSearchParams(window.location.search);
    source = classifySource(document.referrer, params, window.location.hostname);
    const host = referrerHost(document.referrer);
    referrer = host === window.location.hostname.replace(/^www\./, "") ? "" : host;
    store?.setItem(SESSION_KEY, sessionId);
    store?.setItem(SOURCE_KEY, source);
    store?.setItem(REFERRER_KEY, referrer);
  }
  return { sessionId, source, referrer };
}

function pageLocale(): "en" | "ar" {
  return document.documentElement.lang === "ar" ? "ar" : "en";
}

function send(payload: Record<string, unknown>): void {
  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon?.("/api/track", new Blob([body], { type: "text/plain" }))) return;
  } catch {
    // Fall through to fetch.
  }
  void fetch("/api/track", { method: "POST", body, keepalive: true }).catch(() => undefined);
}

/** GA4 event names for our conversions (only sent when GA is configured). */
const GA_EVENTS: Record<string, string> = {
  whatsapp_click: "whatsapp_click",
  form_submit: "generate_lead",
  chat_start: "chat_start",
  chat_lead: "generate_lead",
};

function sendToGa(type: string, label: string): void {
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  const name = GA_EVENTS[type];
  if (!gtag || !name) return;
  gtag("event", name, { method: label || type, page_path: window.location.pathname });
}

/**
 * Reports an event. Page views and WhatsApp clicks go to the first-party
 * endpoint; conversions the server records itself (contact form, chatbot) are
 * only mirrored to GA4.
 */
export function track(type: "pageview" | "whatsapp_click" | "form_submit" | "chat_start" | "chat_lead", label = ""): void {
  if (typeof window === "undefined") return;
  sendToGa(type, label);
  if (type !== "pageview" && type !== "whatsapp_click") return;
  const visit = getVisit();
  send({
    type,
    sessionId: visit.sessionId,
    source: visit.source,
    referrer: visit.referrer,
    path: window.location.pathname,
    locale: pageLocale(),
    label,
  });
}

/** Context attached to form/chatbot submissions so leads keep their origin. */
export function visitMeta() {
  const visit = getVisit();
  return {
    sessionId: visit.sessionId,
    source: visit.source,
    page: window.location.pathname,
    locale: pageLocale(),
  };
}
