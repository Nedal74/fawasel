"use client";

import { Loader2, Save } from "lucide-react";
import { useActionState } from "react";

import { saveContentAction, type ActionState } from "@/app/admin/actions";
import type { SiteContentBlock } from "@/lib/cms/types";
import type { AdminStrings } from "@/i18n/admin";

/** Edits every CMS copy block, grouped by the section it appears in. */
export function ContentForm({ groups, t }: { groups: [string, SiteContentBlock[]][]; t: AdminStrings }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(saveContentAction, {});

  return (
    <form action={formAction} className="pb-24">
      <div className="space-y-10">
        {groups.map(([group, blocks]) => (
          <section key={group}>
            <h2 className="admin-label border-b border-[var(--color-line)] pb-2">{group}</h2>
            <div className="mt-4 space-y-6">
              {blocks.map((block) => {
                const long = block.value.en.length > 90 || block.value.ar.length > 90;
                const Tag = long ? "textarea" : "input";
                return (
                  <div key={block.id}>
                    <p className="text-xs text-dim">{block.key}</p>
                    <div className="mt-2 grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="admin-label" htmlFor={`${block.id}-en`}>
                          {t.english}
                        </label>
                        <Tag
                          id={`${block.id}-en`}
                          name={`${block.id}.en`}
                          defaultValue={block.value.en}
                          rows={long ? 3 : undefined}
                          className="admin-input"
                        />
                      </div>
                      <div>
                        <label className="admin-label" htmlFor={`${block.id}-ar`}>
                          {t.arabic}
                        </label>
                        <Tag
                          id={`${block.id}-ar`}
                          name={`${block.id}.ar`}
                          defaultValue={block.value.ar}
                          dir="rtl"
                          rows={long ? 3 : undefined}
                          className="admin-input"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-line)] bg-ink/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-5 py-3 lg:px-8">
          <p className="text-xs" role="status">
            {state.error ? (
              <span className="text-accent">{state.error}</span>
            ) : state.ok ? (
              <span className="text-emerald-400">{t.saved}</span>
            ) : (
              <span className="text-dim">{t.copyNote}</span>
            )}
          </p>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded btn-accent px-5 py-2 text-[0.6875rem] font-medium uppercase tracking-[0.12em] disabled:opacity-60"
          >
            {pending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <Save className="h-3.5 w-3.5" aria-hidden />
            )}
            {t.saveCopy}
          </button>
        </div>
      </div>
    </form>
  );
}
