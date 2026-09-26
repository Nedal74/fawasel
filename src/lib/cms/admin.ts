import "server-only";

import type { ReferenceOptions } from "@/components/admin/DocForm";
import { getStore } from "./store";
import type { CollectionName } from "./types";

/** Human label for a document, from a localized or plain field. */
export function docLabel(doc: Record<string, unknown>, field: string): string {
  const value = doc[field];
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.filter((item) => typeof item === "string").join(", ");
  if (value && typeof value === "object") {
    const localized = value as { en?: string; ar?: string };
    return localized.en?.trim() || localized.ar?.trim() || "";
  }
  if (typeof value === "number") return String(value);
  return "";
}

/** Options for `reference` / `references` fields. */
export async function referenceOptions(): Promise<ReferenceOptions> {
  const store = await getStore();
  const [clients, services, projects] = await Promise.all([
    store.list("clients"),
    store.list("services"),
    store.list("projects"),
  ]);

  return {
    clients: clients.map((row) => ({ id: row.id, label: docLabel(row as never, "name") })),
    services: services.map((row) => ({ id: row.id, label: docLabel(row as never, "title") })),
    projects: projects.map((row) => ({ id: row.id, label: docLabel(row as never, "name") })),
  };
}

export async function mediaOptions() {
  const store = await getStore();
  const assets = await store.list("media_assets");
  return [...assets]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((asset) => ({ id: asset.id, url: asset.url, fileName: asset.fileName }));
}

export async function listAdmin<K extends CollectionName>(collection: K) {
  const store = await getStore();
  const rows = await store.list(collection);
  return [...rows].sort((a, b) => {
    const orderA = (a as { order?: number }).order ?? 0;
    const orderB = (b as { order?: number }).order ?? 0;
    return orderA - orderB || a.createdAt.localeCompare(b.createdAt);
  });
}
