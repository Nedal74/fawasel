import "server-only";

import path from "node:path";

/**
 * Where locally-uploaded media lives.
 *
 * Deliberately outside `public/`: Next only serves files that were in `public/`
 * when the build ran, so anything uploaded afterwards would 404 in production.
 * These files are streamed by the `/uploads/[...path]` route instead.
 */
export const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(process.cwd(), "data", "uploads");

/** Resolves a public `/uploads/...` URL to a path inside UPLOAD_DIR. */
export function resolveUploadPath(segments: string[]): string | null {
  const relative = segments.join("/");
  if (!relative || relative.includes("\0")) return null;
  const target = path.resolve(UPLOAD_DIR, relative);
  // Reject anything that escapes the upload directory.
  if (target !== UPLOAD_DIR && !target.startsWith(UPLOAD_DIR + path.sep)) return null;
  return target;
}

export const UPLOAD_CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".gif": "image/gif",
};
