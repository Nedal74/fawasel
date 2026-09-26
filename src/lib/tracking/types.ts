/**
 * First-party analytics, leads and chatbot records.
 *
 * These live outside the CMS collections: they are written by visitors, read
 * only by the dashboard, and never publicly readable (see supabase/schema.sql).
 */

/** Events the browser may report itself. */
export const CLIENT_EVENT_TYPES = ["pageview", "whatsapp_click"] as const;

/** Every event type; the conversions are recorded on the server. */
export const EVENT_TYPES = [
  ...CLIENT_EVENT_TYPES,
  "form_submit",
  "chat_start",
  "chat_lead",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export interface TrackEvent {
  id: string;
  createdAt: string;
  /** Random per-tab id kept in sessionStorage — no cookies. */
  sessionId: string;
  type: EventType;
  path: string;
  /** Traffic source bucket: google, whatsapp, linkedin, direct, … */
  source: string;
  /** Referring host only (never the full URL). */
  referrer: string;
  device: "mobile" | "tablet" | "desktop" | "";
  locale: string;
  country: string;
  /** Free-form qualifier, e.g. where a WhatsApp button sat. */
  label: string;
}

export type NewEvent = Omit<TrackEvent, "id" | "createdAt">;

export type LeadOrigin = "contact_form" | "chatbot";

export interface Lead {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  /** Page the visitor was on when they converted. */
  page: string;
  source: string;
  origin: LeadOrigin;
  conversationId: string | null;
  handled: boolean;
}

export type NewLead = Omit<Lead, "id" | "createdAt" | "updatedAt">;

export interface ChatMessage {
  from: "bot" | "user";
  text: string;
  /** option = a button the visitor picked, text = typed, answer = knowledge-base reply. */
  kind: "message" | "option" | "text" | "answer" | "fallback" | "system";
  at: string;
}

export interface Conversation {
  id: string;
  createdAt: string;
  updatedAt: string;
  sessionId: string;
  locale: string;
  /** Page the conversation started on. */
  page: string;
  source: string;
  device: string;
  messages: ChatMessage[];
  isLead: boolean;
  outcome: "" | "whatsapp" | "lead";
  leadId: string | null;
}

export type NewConversation = Omit<Conversation, "id" | "createdAt" | "updatedAt">;

export interface UnansweredQuestion {
  id: string;
  createdAt: string;
  question: string;
  locale: string;
  page: string;
  conversationId: string | null;
  resolved: boolean;
}

export type NewUnanswered = Omit<UnansweredQuestion, "id" | "createdAt">;
