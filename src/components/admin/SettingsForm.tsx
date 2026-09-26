"use client";

import { Loader2, Save } from "lucide-react";
import { useActionState } from "react";

import { saveSettingsAction, type ActionState } from "@/app/admin/actions";
import { MediaPicker, type MediaOption } from "@/components/admin/MediaPicker";
import type { SiteSettings } from "@/lib/cms/types";
import type { AdminStrings } from "@/i18n/admin";

export function SettingsForm({
  settings,
  media,
  t,
}: {
  settings: SiteSettings;
  media: MediaOption[];
  t: AdminStrings;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    saveSettingsAction,
    {},
  );

  const sectionKeys = Object.keys(settings.sections ?? {});

  return (
    <form action={formAction} className="space-y-10 pb-24">
      <section>
        <h2 className="admin-label border-b border-[var(--color-line)] pb-2">{t.seoGroup}</h2>
        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          <div>
            <label className="admin-label" htmlFor="siteTitle-en">
              {t.siteTitleField} · EN
            </label>
            <input
              id="siteTitle-en"
              name="siteTitle.en"
              defaultValue={settings.siteTitle.en}
              className="admin-input"
            />
          </div>
          <div>
            <label className="admin-label" htmlFor="siteTitle-ar">
              {t.siteTitleField} · AR
            </label>
            <input
              id="siteTitle-ar"
              name="siteTitle.ar"
              defaultValue={settings.siteTitle.ar}
              dir="rtl"
              className="admin-input"
            />
          </div>
          <div>
            <label className="admin-label" htmlFor="siteDescription-en">
              {t.descriptionField} · EN
            </label>
            <textarea
              id="siteDescription-en"
              name="siteDescription.en"
              rows={3}
              defaultValue={settings.siteDescription.en}
              className="admin-input"
            />
          </div>
          <div>
            <label className="admin-label" htmlFor="siteDescription-ar">
              {t.descriptionField} · AR
            </label>
            <textarea
              id="siteDescription-ar"
              name="siteDescription.ar"
              rows={3}
              dir="rtl"
              defaultValue={settings.siteDescription.ar}
              className="admin-input"
            />
          </div>
          <div className="lg:col-span-2">
            <label className="admin-label" htmlFor="keywords">
              {t.keywordsField}
            </label>
            <input
              id="keywords"
              name="keywords"
              defaultValue={settings.keywords}
              className="admin-input"
            />
          </div>
          <MediaPicker name="ogImage" label={t.ogImageField} defaultValue={settings.ogImage} library={media} t={t} />
          <div>
            <label className="admin-label" htmlFor="favicon">
              {t.faviconField}
            </label>
            <input
              id="favicon"
              name="favicon"
              defaultValue={settings.favicon}
              className="admin-input"
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="admin-label border-b border-[var(--color-line)] pb-2">{t.contactGroup}</h2>
        <div className="mt-4 grid gap-5 lg:grid-cols-3">
          <div>
            <label className="admin-label" htmlFor="email">
              {t.emailField}
            </label>
            <input id="email" name="email" defaultValue={settings.email} className="admin-input" />
          </div>
          <div>
            <label className="admin-label" htmlFor="whatsapp">
              {t.whatsappField}
            </label>
            <input
              id="whatsapp"
              name="whatsapp"
              defaultValue={settings.whatsapp}
              dir="ltr"
              className="admin-input"
            />
          </div>
          <div>
            <label className="admin-label" htmlFor="defaultLocale">
              {t.defaultLocaleField}
            </label>
            <select
              id="defaultLocale"
              name="defaultLocale"
              defaultValue={settings.defaultLocale}
              className="admin-input"
            >
              <option value="en">{t.languageEnglish}</option>
              <option value="ar">{t.languageArabic}</option>
            </select>
          </div>
        </div>
      </section>

      <section>
        <h2 className="admin-label border-b border-[var(--color-line)] pb-2">{t.gaGroup}</h2>
        <div className="mt-4 grid gap-5 lg:grid-cols-3">
          <div>
            <label className="admin-label" htmlFor="gaMeasurementId">
              {t.gaField}
            </label>
            <input
              id="gaMeasurementId"
              name="gaMeasurementId"
              defaultValue={settings.gaMeasurementId ?? ""}
              placeholder="G-XXXXXXXXXX"
              dir="ltr"
              className="admin-input"
            />
          </div>
          <p className="self-end text-xs leading-relaxed text-dim lg:col-span-2">{t.gaHelp}</p>
        </div>
      </section>

      <section>
        <h2 className="admin-label border-b border-[var(--color-line)] pb-2">{t.appearanceGroup}</h2>
        <div className="mt-4 grid gap-5 lg:grid-cols-3">
          <div>
            <label className="admin-label" htmlFor="accentFrom">
              {t.accentFromField}
            </label>
            <input
              id="accentFrom"
              name="accentFrom"
              type="color"
              defaultValue={settings.accentFrom}
              className="admin-input h-11 p-1"
            />
          </div>
          <div>
            <label className="admin-label" htmlFor="accentTo">
              {t.accentToField}
            </label>
            <input
              id="accentTo"
              name="accentTo"
              type="color"
              defaultValue={settings.accentTo}
              className="admin-input h-11 p-1"
            />
          </div>
          <div>
            <label className="admin-label" htmlFor="visualIntensity">
              {t.intensityField} ({settings.visualIntensity}%)
            </label>
            <input
              id="visualIntensity"
              name="visualIntensity"
              type="range"
              min={0}
              max={100}
              defaultValue={settings.visualIntensity}
              className="w-full accent-[var(--accent-to)]"
            />
            <p className="mt-1 text-[0.6875rem] text-dim">
              {t.intensityHelp}
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="admin-label border-b border-[var(--color-line)] pb-2">{t.imageryGroup}</h2>
        <div className="mt-4 grid gap-5 lg:grid-cols-3">
          <MediaPicker name="heroImage" label={t.heroImageField} defaultValue={settings.heroImage} library={media} t={t} />
          <MediaPicker
            name="heroRevealImage"
            label={t.heroRevealField}
            defaultValue={settings.heroRevealImage}
            library={media}
            t={t}
          />
          <MediaPicker name="aboutImage" label={t.aboutImageField} defaultValue={settings.aboutImage} library={media} t={t} />
          <div>
            <label className="admin-label" htmlFor="aboutMedia">
              {t.aboutMediaField}
            </label>
            <select
              id="aboutMedia"
              name="aboutMedia"
              defaultValue={settings.aboutMedia ?? "pills"}
              className="admin-input"
            >
              <option value="pills">{t.aboutMediaPills}</option>
              <option value="image">{t.aboutMediaImage}</option>
            </select>
            <p className="mt-1.5 text-[0.6875rem] text-dim">{t.aboutMediaHelp}</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="admin-label border-b border-[var(--color-line)] pb-2">{t.sectionsGroup}</h2>
        <ul className="mt-4 flex flex-wrap gap-3">
          {sectionKeys.map((key) => (
            <li key={key}>
              <label className="inline-flex items-center gap-2 rounded border border-[var(--color-line)] px-3 py-2 text-sm capitalize">
                <input
                  type="checkbox"
                  name={`section.${key}`}
                  defaultChecked={settings.sections[key]}
                  className="h-4 w-4 accent-[var(--accent-to)]"
                />
                {key}
              </label>
            </li>
          ))}
        </ul>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-line)] bg-ink/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-5 py-3 lg:px-8">
          <p className="text-xs" role="status">
            {state.error ? (
              <span className="text-accent">{state.error}</span>
            ) : state.ok ? (
              <span className="text-emerald-400">{t.saved}</span>
            ) : (
              <span className="text-dim">{t.settingsNote}</span>
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
            {t.saveSettings}
          </button>
        </div>
      </div>
    </form>
  );
}
