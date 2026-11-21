"use client";

import { ChevronLeft, ChevronRight, ImagePlus, Upload, X } from "lucide-react";
import { useRef, useState } from "react";

import type { MediaOption } from "@/components/admin/MediaPicker";
import type { AdminStrings } from "@/i18n/admin";

/**
 * Gallery field: pick several images from the media library, upload new ones,
 * reorder them, and drop the ones you no longer want. The chosen URLs are
 * submitted as one newline-separated value, the same shape the single-image
 * field stores, so nothing downstream changes.
 */
export function MediaMultiPicker({
  name,
  defaultValue = [],
  library,
  label,
  t,
}: {
  name: string;
  defaultValue?: string[];
  library: MediaOption[];
  label?: string;
  t: AdminStrings;
}) {
  const [urls, setUrls] = useState<string[]>(defaultValue);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [assets, setAssets] = useState(library);
  const [draft, setDraft] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const add = (url: string) =>
    setUrls((current) => (current.includes(url) ? current : [...current, url]));

  /** Accepts one URL or a pasted block of them, one per line. */
  const addDraft = () => {
    const urls = draft
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean);
    if (urls.length === 0) return;
    setUrls((current) => [...current, ...urls.filter((url) => !current.includes(url))]);
    setDraft("");
  };

  const move = (index: number, step: number) =>
    setUrls((current) => {
      const next = [...current];
      const target = index + step;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  async function upload(files: FileList) {
    setUploading(true);
    setError("");
    try {
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.append("file", file);
        const response = await fetch("/api/admin/media", { method: "POST", body });
        const json = (await response.json()) as { url?: string; id?: string; error?: string };
        const url = json.url;
        if (!response.ok || !url) throw new Error(json.error ?? t.uploadFailed);
        setAssets((current) => [{ id: json.id ?? url, url, fileName: file.name }, ...current]);
        add(url);
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : t.uploadFailed);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      {label ? <span className="admin-label">{label}</span> : null}

      {/* The value the form posts; the UI above it is what the editor touches. */}
      <input type="hidden" name={name} value={urls.join("\n")} />

      {urls.length > 0 ? (
        <ul className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {urls.map((url, index) => (
            <li
              key={url}
              className="group relative aspect-square overflow-hidden rounded border border-[var(--color-line)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              <span className="absolute start-1 top-1 rounded bg-black/70 px-1.5 text-[0.625rem] tabular-nums text-offwhite">
                {index + 1}
              </span>
              <button
                type="button"
                onClick={() => setUrls((current) => current.filter((item) => item !== url))}
                aria-label={`${t.clear} ${index + 1}`}
                className="absolute end-1 top-1 rounded bg-black/70 p-1 text-offwhite hover:text-accent"
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
              <span className="absolute inset-x-1 bottom-1 flex justify-between opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  aria-label={`${t.moveUp} ${index + 1}`}
                  className="rounded bg-black/70 p-1 text-offwhite hover:text-accent"
                >
                  <ChevronLeft className="h-3 w-3 rtl:-scale-x-100" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  aria-label={`${t.moveDown} ${index + 1}`}
                  className="rounded bg-black/70 p-1 text-offwhite hover:text-accent"
                >
                  <ChevronRight className="h-3 w-3 rtl:-scale-x-100" aria-hidden />
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-3 flex items-center gap-2 text-xs text-dim">
          <ImagePlus className="h-3.5 w-3.5" aria-hidden />
          {t.emptyGallery}
        </p>
      )}

      {/* A URL can still be pasted, for an image that is not in the library. */}
      <div className="mb-2 flex gap-2">
        <input
          id={name}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            addDraft();
          }}
          placeholder={t.imagePlaceholder}
          className="admin-input"
        />
        <button
          type="button"
          onClick={addDraft}
          className="shrink-0 rounded border border-[var(--color-line)] px-3 text-[0.6875rem] uppercase tracking-[0.12em] text-muted hover:text-offwhite"
        >
          {t.addImage}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="rounded border border-[var(--color-line)] px-3 py-1.5 text-[0.6875rem] uppercase tracking-[0.12em] text-muted hover:text-offwhite"
        >
          {open ? t.closeLibrary : t.library}
        </button>
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 rounded border border-[var(--color-line)] px-3 py-1.5 text-[0.6875rem] uppercase tracking-[0.12em] text-muted hover:text-offwhite disabled:opacity-50"
        >
          <Upload className="h-3 w-3" aria-hidden />
          {uploading ? t.uploading : t.upload}
        </button>
        {urls.length > 0 ? (
          <button
            type="button"
            onClick={() => setUrls([])}
            className="inline-flex items-center gap-1 text-[0.6875rem] uppercase tracking-[0.12em] text-dim hover:text-accent"
          >
            <X className="h-3 w-3" aria-hidden />
            {t.clear}
          </button>
        ) : null}
      </div>
      {error ? <p className="mt-2 text-xs text-accent">{error}</p> : null}

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(event) => {
          if (event.target.files?.length) void upload(event.target.files);
          event.target.value = "";
        }}
      />

      {open ? (
        <ul className="mt-3 grid max-h-64 grid-cols-3 gap-2 overflow-y-auto rounded border border-[var(--color-line)] p-2 sm:grid-cols-5">
          {assets.length === 0 ? (
            <li className="col-span-full p-4 text-center text-xs text-dim">{t.emptyLibrary}</li>
          ) : null}
          {assets.map((asset) => {
            const chosen = urls.includes(asset.url);
            return (
              <li key={asset.id}>
                <button
                  type="button"
                  onClick={() =>
                    chosen
                      ? setUrls((current) => current.filter((item) => item !== asset.url))
                      : add(asset.url)
                  }
                  title={asset.fileName}
                  aria-pressed={chosen}
                  className={`relative block aspect-square w-full overflow-hidden rounded border ${
                    chosen ? "border-accent" : "border-transparent hover:border-[var(--color-line)]"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset.url} alt={asset.fileName} className="h-full w-full object-cover" />
                  {chosen ? (
                    <span className="absolute inset-0 bg-accent/25" aria-hidden />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
