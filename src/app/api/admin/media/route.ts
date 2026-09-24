import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { getStore, supabaseConfigured } from "@/lib/cms/store";
import { UPLOAD_DIR } from "@/lib/uploads";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/svg+xml", "image/gif"];
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/svg+xml": "svg",
  "image/gif": "gif",
};

/** Authenticated upload endpoint used by the dashboard media picker. */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File is larger than 8MB" }, { status: 413 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: `Unsupported type: ${file.type}` }, { status: 415 });
  }

  const extension = EXTENSIONS[file.type] ?? "bin";
  const key = `${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  let url: string;
  try {
    if (supabaseConfigured()) {
      const { createClient } = await import("@supabase/supabase-js");
      const client = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } },
      );
      const bucket = process.env.SUPABASE_MEDIA_BUCKET ?? "media";
      const { error } = await client.storage
        .from(bucket)
        .upload(key, buffer, { contentType: file.type, upsert: false });
      if (error) throw new Error(error.message);
      url = client.storage.from(bucket).getPublicUrl(key).data.publicUrl;
    } else {
      await mkdir(UPLOAD_DIR, { recursive: true });
      await writeFile(path.join(UPLOAD_DIR, key), buffer);
      url = `/uploads/${key}`;
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 },
    );
  }

  const store = await getStore();
  const asset = await store.create("media_assets", {
    url,
    fileName: file.name,
    alt: { en: "", ar: "" },
    mimeType: file.type,
    size: file.size,
  });

  return NextResponse.json({ id: asset.id, url }, { status: 201 });
}
