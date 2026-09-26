import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import type { TrackingStore } from "../store";
import type {
  Conversation,
  Lead,
  NewConversation,
  NewEvent,
  NewLead,
  NewUnanswered,
  TrackEvent,
  UnansweredQuestion,
} from "../types";

type Database = {
  events: TrackEvent[];
  leads: Lead[];
  conversations: Conversation[];
  unanswered: UnansweredQuestion[];
};

const FILE = process.env.TRACKING_DATA_FILE
  ? path.resolve(process.env.TRACKING_DATA_FILE)
  : path.join(process.cwd(), "data", "tracking.json");

/** Local development only: keeps the most recent events so the file stays small. */
const MAX_EVENTS = 50_000;

const empty = (): Database => ({ events: [], leads: [], conversations: [], unanswered: [] });

const newestFirst = <T extends { createdAt: string }>(rows: T[]) =>
  [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

/**
 * File-backed tracking store for local development. Like the CMS JSON store it
 * re-reads the file when another bundle wrote it and serializes its own writes.
 */
class JsonTrackingStore implements TrackingStore {
  readonly kind = "json" as const;
  private db: Database = empty();
  private loadedAt = -1;
  private queue: Promise<unknown> = Promise.resolve();

  private async refresh(): Promise<void> {
    try {
      const info = await stat(FILE);
      if (info.mtimeMs === this.loadedAt) return;
      this.db = { ...empty(), ...(JSON.parse(await readFile(FILE, "utf8")) as Partial<Database>) };
      this.loadedAt = info.mtimeMs;
    } catch {
      // Missing file: start empty.
    }
  }

  private async flush(): Promise<void> {
    try {
      await mkdir(path.dirname(FILE), { recursive: true });
      const tmp = `${FILE}.${process.pid}.tmp`;
      await writeFile(tmp, JSON.stringify(this.db), "utf8");
      await rename(tmp, FILE);
      this.loadedAt = (await stat(FILE)).mtimeMs;
    } catch {
      // Read-only filesystem: keep the data in memory.
    }
  }

  private write<T>(fn: (db: Database) => T): Promise<T> {
    const next = this.queue.then(async () => {
      await this.refresh();
      const result = fn(this.db);
      await this.flush();
      return result;
    });
    this.queue = next.catch(() => undefined);
    return next;
  }

  private async read(): Promise<Database> {
    await this.queue;
    await this.refresh();
    return this.db;
  }

  async recordEvent(event: NewEvent) {
    await this.write((db) => {
      db.events.push({ ...event, id: randomUUID(), createdAt: new Date().toISOString() });
      if (db.events.length > MAX_EVENTS) db.events.splice(0, db.events.length - MAX_EVENTS);
    });
  }

  async listEvents(since: string) {
    return (await this.read()).events.filter((event) => event.createdAt >= since);
  }

  async createLead(lead: NewLead) {
    return this.write((db) => {
      const now = new Date().toISOString();
      const row: Lead = { ...lead, id: randomUUID(), createdAt: now, updatedAt: now };
      db.leads.push(row);
      return row;
    });
  }

  async listLeads(limit = 200) {
    return newestFirst((await this.read()).leads).slice(0, limit);
  }

  async updateLead(id: string, patch: Partial<NewLead>) {
    await this.write((db) => {
      const row = db.leads.find((lead) => lead.id === id);
      if (row) Object.assign(row, patch, { updatedAt: new Date().toISOString() });
    });
  }

  async removeLead(id: string) {
    await this.write((db) => {
      db.leads = db.leads.filter((lead) => lead.id !== id);
    });
  }

  async createConversation(conversation: NewConversation) {
    return this.write((db) => {
      const now = new Date().toISOString();
      const row: Conversation = { ...conversation, id: randomUUID(), createdAt: now, updatedAt: now };
      db.conversations.push(row);
      return row;
    });
  }

  async getConversation(id: string) {
    return (await this.read()).conversations.find((row) => row.id === id) ?? null;
  }

  async listConversations(limit = 200) {
    return newestFirst((await this.read()).conversations).slice(0, limit);
  }

  async updateConversation(id: string, patch: Partial<NewConversation>) {
    await this.write((db) => {
      const row = db.conversations.find((conversation) => conversation.id === id);
      if (row) Object.assign(row, patch, { updatedAt: new Date().toISOString() });
    });
  }

  async removeConversation(id: string) {
    await this.write((db) => {
      db.conversations = db.conversations.filter((row) => row.id !== id);
    });
  }

  async createUnanswered(question: NewUnanswered) {
    return this.write((db) => {
      const row: UnansweredQuestion = {
        ...question,
        id: randomUUID(),
        createdAt: new Date().toISOString(),
      };
      db.unanswered.push(row);
      return row;
    });
  }

  async listUnanswered(limit = 500) {
    return newestFirst((await this.read()).unanswered).slice(0, limit);
  }

  async updateUnanswered(id: string, patch: Partial<NewUnanswered>) {
    await this.write((db) => {
      const row = db.unanswered.find((question) => question.id === id);
      if (row) Object.assign(row, patch);
    });
  }

  async removeUnanswered(id: string) {
    await this.write((db) => {
      db.unanswered = db.unanswered.filter((row) => row.id !== id);
    });
  }
}

export function createJsonTrackingStore(): TrackingStore {
  return new JsonTrackingStore();
}
