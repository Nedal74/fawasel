import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { seedData } from "../defaults";
import type { CmsStore } from "../store";
import type { CollectionMap, CollectionName, DocPatch, NewDoc } from "../types";

type Database = { [K in CollectionName]: CollectionMap[K][] } & {
  /** Ids of one-time migrations already applied to this file. */
  migrations?: string[];
};

/**
 * One-time upgrades for files written by an earlier version. Each runs once and
 * is then recorded, so an admin who deletes the row keeps it deleted.
 */
const MIGRATIONS: { id: string; apply: (db: Database) => boolean }[] = [
  {
    // V2 added the public /articles route.
    id: "v2-articles-nav",
    apply: (db) => {
      if (db.navigation_items.some((item) => item.href === "/articles")) return false;
      const seeded = seedData().navigation_items.find((item) => item.href === "/articles");
      if (!seeded) return false;
      db.navigation_items.push({ ...seeded, order: db.navigation_items.length });
      return true;
    },
  },
];

const FILE = process.env.CMS_DATA_FILE
  ? path.resolve(process.env.CMS_DATA_FILE)
  : path.join(process.cwd(), "data", "cms.json");

/**
 * File-backed adapter used when Supabase credentials are absent.
 *
 * It is a real persistent store for local development and single-node
 * deployments; production on a read-only/serverless filesystem should configure
 * Supabase instead (see README).
 */
class JsonStore implements CmsStore {
  readonly kind = "json" as const;
  writable = true;

  private db: Database;
  /** Serializes writes so concurrent requests cannot interleave a read/write. */
  private queue: Promise<unknown> = Promise.resolve();
  /** mtime of the file as last read/written by this instance. */
  private loadedAt = 0;

  constructor(db: Database, loadedAt: number) {
    this.db = db;
    this.loadedAt = loadedAt;
  }

  /**
   * Re-reads the file when it changed underneath us.
   *
   * Next.js can instantiate this module more than once (server actions and
   * pages are bundled separately), so an in-memory snapshot alone would serve
   * stale content right after an edit.
   */
  private async refresh(): Promise<void> {
    try {
      const info = await stat(FILE);
      if (info.mtimeMs === this.loadedAt) return;
      const parsed = JSON.parse(await readFile(FILE, "utf8")) as Partial<Database>;
      this.db = { ...this.db, ...parsed } as Database;
      this.loadedAt = info.mtimeMs;
    } catch {
      // File missing or unreadable: keep the in-memory copy.
    }
  }

  private run<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.queue.then(fn, fn);
    this.queue = next.catch(() => undefined);
    return next;
  }

  private async flush(): Promise<void> {
    try {
      await mkdir(path.dirname(FILE), { recursive: true });
      const tmp = `${FILE}.${process.pid}.tmp`;
      await writeFile(tmp, JSON.stringify(this.db, null, 2), "utf8");
      await rename(tmp, FILE);
      this.loadedAt = (await stat(FILE)).mtimeMs;
      this.writable = true;
    } catch {
      // Read-only filesystem: keep serving from memory but tell the dashboard.
      this.writable = false;
    }
  }

  /** Writes the current state out once at startup (creates the seed file). */
  async init(): Promise<void> {
    await this.run(() => this.flush());
  }

  async list<K extends CollectionName>(collection: K): Promise<CollectionMap[K][]> {
    await this.refresh();
    return [...(this.db[collection] ?? [])] as CollectionMap[K][];
  }

  async get<K extends CollectionName>(collection: K, id: string) {
    await this.refresh();
    const found = (this.db[collection] as CollectionMap[K][]).find((d) => d.id === id);
    return (found ?? null) as CollectionMap[K] | null;
  }

  async create<K extends CollectionName>(collection: K, data: NewDoc<K>) {
    return this.run(async () => {
      await this.refresh();
      const now = new Date().toISOString();
      const doc = { ...data, id: randomUUID(), createdAt: now, updatedAt: now } as CollectionMap[K];
      (this.db[collection] as CollectionMap[K][]).push(doc);
      await this.flush();
      return doc;
    });
  }

  async update<K extends CollectionName>(collection: K, id: string, patch: DocPatch<K>) {
    return this.run(async () => {
      await this.refresh();
      const rows = this.db[collection] as CollectionMap[K][];
      const index = rows.findIndex((d) => d.id === id);
      if (index === -1) throw new Error(`${collection}/${id} not found`);
      const updated = { ...rows[index], ...patch, updatedAt: new Date().toISOString() };
      rows[index] = updated as CollectionMap[K];
      await this.flush();
      return rows[index];
    });
  }

  async remove<K extends CollectionName>(collection: K, id: string) {
    await this.run(async () => {
      await this.refresh();
      const rows = this.db[collection] as CollectionMap[K][];
      const index = rows.findIndex((d) => d.id === id);
      if (index === -1) return;
      rows.splice(index, 1);
      await this.flush();
    });
  }
}

export async function createJsonStore(): Promise<CmsStore> {
  const seed = seedData() as Database;
  let db: Database = seed;
  let loadedAt = 0;
  try {
    const raw = await readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<Database>;
    // Merge so a collection added in a later version is not missing on disk.
    db = { ...seed, ...parsed } as Database;
    loadedAt = (await stat(FILE)).mtimeMs;

    const applied = new Set(db.migrations ?? []);
    for (const migration of MIGRATIONS) {
      if (applied.has(migration.id)) continue;
      migration.apply(db);
      applied.add(migration.id);
    }
    db.migrations = [...applied];
  } catch {
    // First run (or unreadable file): start from the seed and write it out.
  }
  const store = new JsonStore(db, loadedAt);
  await store.init();
  return store;
}
