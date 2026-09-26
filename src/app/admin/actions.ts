"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCollectionConfig, type CollectionConfig, type Field } from "@/lib/cms/collections";
import { seedData } from "@/lib/cms/defaults";
import { seedStarterContent } from "@/lib/cms/seed";
import { getStore, supabaseConfigured } from "@/lib/cms/store";
import type { CollectionName, SiteSettings } from "@/lib/cms/types";
import { createSession, destroySession, requireSession, verifyCredentials } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export type ActionState = { error?: string; ok?: boolean };

/* ------------------------------------------------------------------ auth -- */

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email and password are required." };

  const valid = await verifyCredentials(email, password);
  if (!valid) return { error: "Invalid credentials." };

  await createSession(email);
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}

/* --------------------------------------------------------------- parsing -- */

function parseField(field: Field, formData: FormData): unknown {
  const raw = formData.get(field.name);
  switch (field.type) {
    case "localized":
    case "localizedArea":
      return {
        en: String(formData.get(`${field.name}.en`) ?? "").trim(),
        ar: String(formData.get(`${field.name}.ar`) ?? "").trim(),
      };
    case "boolean":
      return raw === "on" || raw === "true";
    case "number":
      return Number(raw ?? 0) || 0;
    case "range":
      return Math.min(100, Math.max(0, Number(raw ?? 0) || 0));
    case "tags":
      return String(raw ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
    case "images":
      return String(raw ?? "")
        .split("\n")
        .map((value) => value.trim())
        .filter(Boolean);
    case "references":
      return formData.getAll(field.name).map(String).filter(Boolean);
    case "reference": {
      const value = String(raw ?? "").trim();
      return value || null;
    }
    case "keyMetrics": {
      const labelsEn = formData.getAll("keyMetric.label.en").map(String);
      const labelsAr = formData.getAll("keyMetric.label.ar").map(String);
      const values = formData.getAll("keyMetric.value").map(String);
      return values
        .map((value, i) => ({
          label: { en: labelsEn[i]?.trim() ?? "", ar: labelsAr[i]?.trim() ?? "" },
          value: value.trim(),
        }))
        .filter((metric) => metric.value || metric.label.en || metric.label.ar);
    }
    default:
      return String(raw ?? "").trim();
  }
}

function parseValues(config: CollectionConfig, formData: FormData): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const field of config.fields) values[field.name] = parseField(field, formData);
  return values;
}

async function ensureUniqueSlug(
  collection: CollectionName,
  slug: string,
  currentId: string | null,
): Promise<string> {
  const store = await getStore();
  const rows = (await store.list(collection)) as { id: string; slug?: string }[];
  let candidate = slug;
  let suffix = 2;
  while (rows.some((row) => row.slug === candidate && row.id !== currentId)) {
    candidate = `${slug}-${suffix++}`;
  }
  return candidate;
}

/* ------------------------------------------------------------------ CRUD -- */

export async function saveDocAction(
  collectionName: string,
  id: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireSession();
  const config = getCollectionConfig(collectionName);
  if (!config) return { error: "Unknown collection." };

  const values = parseValues(config, formData);

  // Anything with a slug (projects, articles): derive it from the title when
  // empty, then de-duplicate it within its own collection.
  if (config.fields.some((field) => field.type === "slug")) {
    const titled = (values[config.titleField] ?? {}) as { en?: string; ar?: string };
    const slug = String(values.slug || "").trim() || slugify(titled.en || titled.ar || "");
    if (!slug) return { error: `A ${config.singular.toLowerCase()} needs a title or a slug.` };
    values.slug = await ensureUniqueSlug(config.name, slugify(slug), id);
    if (values.published && !values.publishedAt) values.publishedAt = new Date().toISOString();
  }

  const store = await getStore();
  try {
    if (id) {
      await store.update(config.name, id, values as never);
    } else {
      const created = await store.create(config.name, values as never);
      revalidatePath("/", "layout");
      redirect(`/admin/${config.name}/${created.id}?created=1`);
    }
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: error instanceof Error ? error.message : "Save failed." };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

function isRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export async function deleteDocAction(collectionName: string, id: string): Promise<void> {
  await requireSession();
  const config = getCollectionConfig(collectionName);
  if (!config) return;
  const store = await getStore();
  await store.remove(config.name, id);
  revalidatePath("/", "layout");
  redirect(`/admin/${config.name}`);
}

export async function duplicateDocAction(collectionName: string, id: string): Promise<void> {
  await requireSession();
  const config = getCollectionConfig(collectionName);
  if (!config) return;
  const store = await getStore();
  const doc = await store.get(config.name, id);
  if (!doc) return;

  const copy: Record<string, unknown> = {
    ...(doc as unknown as Record<string, unknown>),
    published: false,
  };
  delete copy.id;
  delete copy.createdAt;
  delete copy.updatedAt;
  if ("slug" in copy && typeof copy.slug === "string") {
    copy.slug = await ensureUniqueSlug(config.name, `${copy.slug}-copy`, null);
  }
  if ("name" in copy && copy.name && typeof copy.name === "object") {
    const name = copy.name as { en: string; ar: string };
    copy.name = { en: `${name.en} (copy)`.trim(), ar: `${name.ar} (نسخة)`.trim() };
  }
  const created = await store.create(config.name, copy as never);
  revalidatePath("/", "layout");
  redirect(`/admin/${config.name}/${created.id}`);
}

export async function togglePublishAction(
  collectionName: string,
  id: string,
  published: boolean,
): Promise<void> {
  await requireSession();
  const config = getCollectionConfig(collectionName);
  if (!config) return;
  const store = await getStore();
  await store.update(config.name, id, { published } as never);
  revalidatePath("/", "layout");
  revalidatePath(`/admin/${config.name}`);
}

/** Moves a row up or down by swapping sort orders with its neighbour. */
export async function reorderAction(
  collectionName: string,
  id: string,
  direction: "up" | "down",
): Promise<void> {
  await requireSession();
  const config = getCollectionConfig(collectionName);
  if (!config) return;
  const store = await getStore();
  const rows = (await store.list(config.name)) as { id: string; order?: number }[];
  const sorted = [...rows].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const index = sorted.findIndex((row) => row.id === id);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= sorted.length) return;

  await store.update(config.name, sorted[index].id, { order: swapWith } as never);
  await store.update(config.name, sorted[swapWith].id, { order: index } as never);
  revalidatePath("/", "layout");
  revalidatePath(`/admin/${config.name}`);
}

/* -------------------------------------------------------------- singleton -- */

export async function saveSettingsAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireSession();
  const store = await getStore();
  const rows = await store.list("site_settings");
  const current = rows[0];

  const sections: Record<string, boolean> = {};
  for (const key of Object.keys(current?.sections ?? {})) {
    sections[key] = formData.get(`section.${key}`) === "on";
  }

  const patch: Partial<SiteSettings> = {
    siteTitle: {
      en: String(formData.get("siteTitle.en") ?? "").trim(),
      ar: String(formData.get("siteTitle.ar") ?? "").trim(),
    },
    siteDescription: {
      en: String(formData.get("siteDescription.en") ?? "").trim(),
      ar: String(formData.get("siteDescription.ar") ?? "").trim(),
    },
    keywords: String(formData.get("keywords") ?? "").trim(),
    ogImage: String(formData.get("ogImage") ?? "").trim(),
    favicon: String(formData.get("favicon") ?? "").trim(),
    defaultLocale: formData.get("defaultLocale") === "ar" ? "ar" : "en",
    email: String(formData.get("email") ?? "").trim(),
    whatsapp: String(formData.get("whatsapp") ?? "").trim(),
    accentFrom: String(formData.get("accentFrom") ?? "").trim(),
    accentTo: String(formData.get("accentTo") ?? "").trim(),
    visualIntensity: Math.min(100, Math.max(0, Number(formData.get("visualIntensity") ?? 70))),
    heroImage: String(formData.get("heroImage") ?? "").trim(),
    heroRevealImage: String(formData.get("heroRevealImage") ?? "").trim(),
    aboutImage: String(formData.get("aboutImage") ?? "").trim(),
    aboutMedia: formData.get("aboutMedia") === "image" ? "image" : "pills",
    gaMeasurementId: parseGaId(formData.get("gaMeasurementId")),
    sections,
  };

  if (current) {
    await store.update("site_settings", current.id, patch as never);
  } else {
    await store.create("site_settings", patch as never);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Accepts only a well-formed GA4 id; anything else turns GA off. */
function parseGaId(value: FormDataEntryValue | null): string {
  const id = String(value ?? "").trim().toUpperCase();
  return /^G-[A-Z0-9]{4,16}$/.test(id) ? id : "";
}

export async function saveContentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireSession();
  const store = await getStore();
  const blocks = await store.list("site_content");

  await Promise.all(
    blocks.map(async (block) => {
      const en = formData.get(`${block.id}.en`);
      const ar = formData.get(`${block.id}.ar`);
      if (en === null && ar === null) return;
      const next = { en: String(en ?? "").trim(), ar: String(ar ?? "").trim() };
      if (next.en === block.value.en && next.ar === block.value.ar) return;
      await store.update("site_content", block.id, { value: next });
    }),
  );

  // Keys that exist only in the defaults (added after this site was seeded).
  const storedKeys = new Set(blocks.map((block) => block.key));
  for (const block of seedData().site_content) {
    if (storedKeys.has(block.key)) continue;
    const en = formData.get(`${block.id}.en`);
    const ar = formData.get(`${block.id}.ar`);
    if (en === null && ar === null) continue;
    const next = { en: String(en ?? "").trim(), ar: String(ar ?? "").trim() };
    if (next.en === block.value.en && next.ar === block.value.ar) continue;
    await store.create("site_content", {
      key: block.key,
      group: block.group,
      label: block.label,
      value: next,
      order: block.order,
    });
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

/** Fills an empty database with the starter content (fresh Supabase project). */
export async function seedStarterContentAction(): Promise<void> {
  await requireSession();
  const store = await getStore();
  await seedStarterContent(store);
  revalidatePath("/", "layout");
  redirect("/admin?seeded=1");
}

export async function deleteMediaAction(id: string): Promise<void> {
  await requireSession();
  const store = await getStore();
  const asset = await store.get("media_assets", id);
  if (asset) {
    await deleteMediaObject(asset.url);
    await store.remove("media_assets", id);
  }
  revalidatePath("/admin/media");
}

/** Removes the stored file behind a media asset, best-effort. */
async function deleteMediaObject(url: string): Promise<void> {
  try {
    if (url.startsWith("/uploads/")) {
      const { unlink } = await import("node:fs/promises");
      const { resolveUploadPath } = await import("@/lib/uploads");
      const target = resolveUploadPath(url.replace("/uploads/", "").split("/"));
      if (target) await unlink(target);
      return;
    }
    if (supabaseConfigured()) {
      const bucket = process.env.SUPABASE_MEDIA_BUCKET ?? "media";
      const marker = `/storage/v1/object/public/${bucket}/`;
      const key = url.includes(marker) ? url.slice(url.indexOf(marker) + marker.length) : "";
      if (!key) return;
      const { createClient } = await import("@supabase/supabase-js");
      const client = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } },
      );
      await client.storage.from(bucket).remove([key]);
    }
  } catch {
    // The row is still removed even if the object is already gone.
  }
}
