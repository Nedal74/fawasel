import "server-only";

import { seedData } from "./defaults";
import type { CmsStore } from "./store";
import type { CollectionName } from "./types";

/** Collections filled by the starter content — media and inquiries stay empty. */
const SEEDED: CollectionName[] = [
  "site_settings",
  "site_content",
  "services",
  "skills",
  "clients",
  "metrics",
  "social_links",
  "navigation_items",
  "chatbot",
  "chat_knowledge",
];

export type SeedReport = { collection: CollectionName; inserted: number; skipped: boolean }[];

/**
 * Writes the starter content (site copy, services, skills, clients, metrics,
 * social links, navigation) into an empty database.
 *
 * Used on a fresh Supabase project, where nothing exists yet. It only ever adds
 * to a collection that is completely empty, so running it twice cannot
 * duplicate rows or overwrite an edit.
 */
export async function seedStarterContent(store: CmsStore): Promise<SeedReport> {
  const seed = seedData();
  const report: SeedReport = [];

  for (const collection of SEEDED) {
    // A table missing from an older schema is skipped rather than failing all.
    const existing = await store.list(collection).catch(() => null);
    if (existing === null || existing.length > 0) {
      report.push({ collection, inserted: 0, skipped: true });
      continue;
    }

    const rows = seed[collection] as unknown as Record<string, unknown>[];
    for (const row of rows) {
      // The store assigns its own id and timestamps.
      const doc: Record<string, unknown> = { ...row };
      delete doc.id;
      delete doc.createdAt;
      delete doc.updatedAt;
      await store.create(collection, doc as never);
    }
    report.push({ collection, inserted: rows.length, skipped: false });
  }

  return report;
}

/**
 * Starter collections that are currently empty.
 *
 * Checked one by one so a database where only some sections were filled (or
 * one was cleared) still offers to load the missing starter content.
 */
export async function emptySeedCollections(store: CmsStore): Promise<CollectionName[]> {
  const counts = await Promise.all(
    SEEDED.map(async (collection) => ({
      collection,
      // Unreadable (table not created yet) counts as not empty: nothing to seed.
      empty: (await store.list(collection).catch(() => [null])).length === 0,
    })),
  );
  return counts.filter((entry) => entry.empty).map((entry) => entry.collection);
}

/** True when the database has no content yet (fresh Supabase project). */
export async function isDatabaseEmpty(store: CmsStore): Promise<boolean> {
  return (await emptySeedCollections(store)).length === SEEDED.length;
}
