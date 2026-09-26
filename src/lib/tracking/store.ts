import "server-only";

import { supabaseConfigured } from "@/lib/cms/store";

import type {
  Conversation,
  Lead,
  NewConversation,
  NewEvent,
  NewLead,
  NewUnanswered,
  TrackEvent,
  UnansweredQuestion,
} from "./types";

/**
 * Storage for visitor-generated records (analytics events, leads, chatbot
 * conversations and unanswered questions).
 *
 * Same pattern as `CmsStore`: one interface, a Supabase adapter for
 * production and a JSON-file adapter for local development.
 */
export interface TrackingStore {
  readonly kind: "supabase" | "json";

  recordEvent(event: NewEvent): Promise<void>;
  /** Events created at or after `since` (ISO), oldest first. */
  listEvents(since: string): Promise<TrackEvent[]>;

  createLead(lead: NewLead): Promise<Lead>;
  listLeads(limit?: number): Promise<Lead[]>;
  updateLead(id: string, patch: Partial<NewLead>): Promise<void>;
  removeLead(id: string): Promise<void>;

  createConversation(conversation: NewConversation): Promise<Conversation>;
  getConversation(id: string): Promise<Conversation | null>;
  /** Newest first. */
  listConversations(limit?: number): Promise<Conversation[]>;
  updateConversation(id: string, patch: Partial<NewConversation>): Promise<void>;
  removeConversation(id: string): Promise<void>;

  createUnanswered(question: NewUnanswered): Promise<UnansweredQuestion>;
  /** Newest first. */
  listUnanswered(limit?: number): Promise<UnansweredQuestion[]>;
  updateUnanswered(id: string, patch: Partial<NewUnanswered>): Promise<void>;
  removeUnanswered(id: string): Promise<void>;
}

let cached: TrackingStore | null = null;

export async function getTrackingStore(): Promise<TrackingStore> {
  if (cached) return cached;
  if (supabaseConfigured()) {
    const { createSupabaseTrackingStore } = await import("./adapters/supabase");
    cached = createSupabaseTrackingStore();
  } else {
    const { createJsonTrackingStore } = await import("./adapters/json");
    cached = createJsonTrackingStore();
  }
  return cached;
}

/**
 * Runs a tracking write without ever failing the visitor's request — e.g. when
 * the analytics tables have not been created yet.
 */
export async function safely<T>(label: string, fn: (store: TrackingStore) => Promise<T>) {
  try {
    return await fn(await getTrackingStore());
  } catch (error) {
    console.warn(`[tracking] ${label} failed:`, error instanceof Error ? error.message : error);
    return null;
  }
}
