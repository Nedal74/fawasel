"use client";

import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import type { AdminStrings } from "@/i18n/admin";

/** Multi-file upload used on the media library page. */
export function MediaUploader({ t }: { t: AdminStrings }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(files: FileList) {
    setBusy(true);
    setError("");
    try {
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.append("file", file);
        const response = await fetch("/api/admin/media", { method: "POST", body });
        if (!response.ok) {
          const json = (await response.json()) as { error?: string };
          throw new Error(json.error ?? `${t.uploadFailed}: ${file.name}`);
        }
      }
      router.refresh();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : t.uploadFailed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded btn-accent px-5 py-2.5 text-[0.6875rem] font-medium uppercase tracking-[0.12em] disabled:opacity-60"
      >
        <Upload className="h-3.5 w-3.5" aria-hidden />
        {busy ? t.uploading : t.uploadFiles}
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(event) => {
          if (event.target.files?.length) void upload(event.target.files);
          event.target.value = "";
        }}
      />
      {error ? <p className="mt-3 text-sm text-accent">{error}</p> : null}
    </div>
  );
}
