import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

import { NextResponse } from "next/server";

import { UPLOAD_CONTENT_TYPES, resolveUploadPath } from "@/lib/uploads";

/**
 * Serves media uploaded through the dashboard (file-adapter installs).
 * With Supabase configured, media is served from Supabase Storage instead and
 * this route is never hit.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  const filePath = resolveUploadPath(segments);
  if (!filePath) return new NextResponse("Not found", { status: 404 });

  try {
    const info = await stat(filePath);
    if (!info.isFile()) return new NextResponse("Not found", { status: 404 });

    const type = UPLOAD_CONTENT_TYPES[path.extname(filePath).toLowerCase()];
    if (!type) return new NextResponse("Unsupported media type", { status: 415 });

    const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream;
    return new NextResponse(stream, {
      headers: {
        "Content-Type": type,
        "Content-Length": String(info.size),
        "Cache-Control": "public, max-age=31536000, immutable",
        // Uploaded SVGs are rendered as images only.
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
