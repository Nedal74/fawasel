import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { TrackingStore } from "../store";
import type {
  ChatMessage,
  Conversation,
  EventType,
  Lead,
  LeadOrigin,
  NewConversation,
  NewEvent,
  NewLead,
  NewUnanswered,
  TrackEvent,
  UnansweredQuestion,
} from "../types";

/**
 * Supabase adapter for the tracking tables (see supabase/schema.sql).
 *
 * Unlike the CMS collections these are plain columns, so the dashboard can
 * filter and page them in SQL. RLS is enabled with no policies: only the
 * service-role key used here can read or write them.
 */

type Row = Record<string, unknown>;

const str = (value: unknown) => (typeof value === "string" ? value : value == null ? "" : String(value));

const toEvent = (row: Row): TrackEvent => ({
  id: str(row.id),
  createdAt: str(row.created_at),
  sessionId: str(row.session_id),
  type: str(row.type) as EventType,
  path: str(row.path),
  source: str(row.source),
  referrer: str(row.referrer),
  device: str(row.device) as TrackEvent["device"],
  locale: str(row.locale),
  country: str(row.country),
  label: str(row.label),
});

const toLead = (row: Row): Lead => ({
  id: str(row.id),
  createdAt: str(row.created_at),
  updatedAt: str(row.updated_at),
  name: str(row.name),
  phone: str(row.phone),
  email: str(row.email),
  message: str(row.message),
  page: str(row.page),
  source: str(row.source),
  origin: str(row.origin) as LeadOrigin,
  conversationId: (row.conversation_id as string | null) ?? null,
  handled: Boolean(row.handled),
});

const leadColumns = (lead: Partial<NewLead>): Row => {
  const row: Row = {};
  if (lead.name !== undefined) row.name = lead.name;
  if (lead.phone !== undefined) row.phone = lead.phone;
  if (lead.email !== undefined) row.email = lead.email;
  if (lead.message !== undefined) row.message = lead.message;
  if (lead.page !== undefined) row.page = lead.page;
  if (lead.source !== undefined) row.source = lead.source;
  if (lead.origin !== undefined) row.origin = lead.origin;
  if (lead.conversationId !== undefined) row.conversation_id = lead.conversationId;
  if (lead.handled !== undefined) row.handled = lead.handled;
  return row;
};

const toConversation = (row: Row): Conversation => ({
  id: str(row.id),
  createdAt: str(row.created_at),
  updatedAt: str(row.updated_at),
  sessionId: str(row.session_id),
  locale: str(row.locale),
  page: str(row.page),
  source: str(row.source),
  device: str(row.device),
  messages: Array.isArray(row.messages) ? (row.messages as ChatMessage[]) : [],
  isLead: Boolean(row.is_lead),
  outcome: str(row.outcome) as Conversation["outcome"],
  leadId: (row.lead_id as string | null) ?? null,
});

const conversationColumns = (conversation: Partial<NewConversation>): Row => {
  const row: Row = {};
  if (conversation.sessionId !== undefined) row.session_id = conversation.sessionId;
  if (conversation.locale !== undefined) row.locale = conversation.locale;
  if (conversation.page !== undefined) row.page = conversation.page;
  if (conversation.source !== undefined) row.source = conversation.source;
  if (conversation.device !== undefined) row.device = conversation.device;
  if (conversation.messages !== undefined) row.messages = conversation.messages;
  if (conversation.isLead !== undefined) row.is_lead = conversation.isLead;
  if (conversation.outcome !== undefined) row.outcome = conversation.outcome;
  if (conversation.leadId !== undefined) row.lead_id = conversation.leadId;
  return row;
};

const toUnanswered = (row: Row): UnansweredQuestion => ({
  id: str(row.id),
  createdAt: str(row.created_at),
  question: str(row.question),
  locale: str(row.locale),
  page: str(row.page),
  conversationId: (row.conversation_id as string | null) ?? null,
  resolved: Boolean(row.resolved),
});

const unansweredColumns = (question: Partial<NewUnanswered>): Row => {
  const row: Row = {};
  if (question.question !== undefined) row.question = question.question;
  if (question.locale !== undefined) row.locale = question.locale;
  if (question.page !== undefined) row.page = question.page;
  if (question.conversationId !== undefined) row.conversation_id = question.conversationId;
  if (question.resolved !== undefined) row.resolved = question.resolved;
  return row;
};

/** Supabase caps a select at 1000 rows, so events are read in pages. */
const PAGE = 1000;
const MAX_EVENTS = 200_000;

class SupabaseTrackingStore implements TrackingStore {
  readonly kind = "supabase" as const;

  constructor(private client: SupabaseClient) {}

  private fail(what: string, error: { message: string } | null): void {
    if (error) throw new Error(`[supabase] ${what}: ${error.message}`);
  }

  async recordEvent(event: NewEvent) {
    const { error } = await this.client.from("analytics_events").insert({
      session_id: event.sessionId,
      type: event.type,
      path: event.path,
      source: event.source,
      referrer: event.referrer,
      device: event.device,
      locale: event.locale,
      country: event.country,
      label: event.label,
    });
    this.fail("record event", error);
  }

  async listEvents(since: string) {
    const rows: TrackEvent[] = [];
    for (let from = 0; from < MAX_EVENTS; from += PAGE) {
      const { data, error } = await this.client
        .from("analytics_events")
        .select("id, created_at, session_id, type, path, source, referrer, device, locale, country, label")
        .gte("created_at", since)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })
        .range(from, from + PAGE - 1);
      this.fail("list events", error);
      rows.push(...(data as Row[]).map(toEvent));
      if (!data || data.length < PAGE) break;
    }
    return rows;
  }

  async createLead(lead: NewLead) {
    const { data, error } = await this.client
      .from("leads")
      .insert(leadColumns(lead))
      .select("*")
      .single();
    this.fail("create lead", error);
    return toLead(data as Row);
  }

  async listLeads(limit = 200) {
    const { data, error } = await this.client
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    this.fail("list leads", error);
    return (data as Row[]).map(toLead);
  }

  async updateLead(id: string, patch: Partial<NewLead>) {
    const { error } = await this.client.from("leads").update(leadColumns(patch)).eq("id", id);
    this.fail("update lead", error);
  }

  async removeLead(id: string) {
    const { error } = await this.client.from("leads").delete().eq("id", id);
    this.fail("delete lead", error);
  }

  async createConversation(conversation: NewConversation) {
    const { data, error } = await this.client
      .from("chat_conversations")
      .insert(conversationColumns(conversation))
      .select("*")
      .single();
    this.fail("create conversation", error);
    return toConversation(data as Row);
  }

  async getConversation(id: string) {
    const { data, error } = await this.client
      .from("chat_conversations")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    this.fail("get conversation", error);
    return data ? toConversation(data as Row) : null;
  }

  async listConversations(limit = 200) {
    const { data, error } = await this.client
      .from("chat_conversations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    this.fail("list conversations", error);
    return (data as Row[]).map(toConversation);
  }

  async updateConversation(id: string, patch: Partial<NewConversation>) {
    const { error } = await this.client
      .from("chat_conversations")
      .update(conversationColumns(patch))
      .eq("id", id);
    this.fail("update conversation", error);
  }

  async removeConversation(id: string) {
    const { error } = await this.client.from("chat_conversations").delete().eq("id", id);
    this.fail("delete conversation", error);
  }

  async createUnanswered(question: NewUnanswered) {
    const { data, error } = await this.client
      .from("chat_unanswered")
      .insert(unansweredColumns(question))
      .select("*")
      .single();
    this.fail("create unanswered", error);
    return toUnanswered(data as Row);
  }

  async listUnanswered(limit = 500) {
    const { data, error } = await this.client
      .from("chat_unanswered")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    this.fail("list unanswered", error);
    return (data as Row[]).map(toUnanswered);
  }

  async updateUnanswered(id: string, patch: Partial<NewUnanswered>) {
    const { error } = await this.client
      .from("chat_unanswered")
      .update(unansweredColumns(patch))
      .eq("id", id);
    this.fail("update unanswered", error);
  }

  async removeUnanswered(id: string) {
    const { error } = await this.client.from("chat_unanswered").delete().eq("id", id);
    this.fail("delete unanswered", error);
  }
}

export function createSupabaseTrackingStore(): TrackingStore {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase is not configured");
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return new SupabaseTrackingStore(client);
}
