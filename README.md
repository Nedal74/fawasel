# NEDAL ELABID — Portfolio & CMS

Personal brand platform for **NEDAL ELABID / نضال الأبيض** — Marketing Manager,
Growth Marketer, Creative Director — built as two connected halves:

1. a **premium public portfolio** (Executive Cyberpunk × Marketing Intelligence
   direction, English + Arabic with correct RTL), and
2. a **protected CMS dashboard** at `/admin` where every project, client,
   service, skill, metric, social link and line of copy is edited — no code
   changes, no redeploy.

A logged-in admin can create a project, upload its media, publish it, and see it
live on `/projects` and `/projects/<slug>` immediately. The same is true for
clients, services, skills, metrics, navigation, social links and site copy.

---

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router, React 19, TypeScript) |
| Styling | Tailwind CSS v4 + a token-based design system in `src/app/globals.css` |
| Palette | Black `#000000` · White `#FFFFFF` · Lime `#BEF532` (the signature accent) |
| Icons | lucide-react |
| Type | JetBrains Mono (Latin) · IBM Plex Sans Arabic (Arabic) |
| Data | Supabase (Postgres + Storage) when configured, file-backed JSON otherwise |
| Auth | Server-side session cookie (HMAC-signed, httpOnly), scrypt password hash |

> The original brief specified React 18 + Vite. Next.js was chosen instead so the
> dashboard's authentication and CRUD run **on the server** (no service-role key
> in the browser) and so each case study gets real per-page SEO metadata. Every
> other requirement in the brief is unchanged.

---

## Quick start

```bash
npm install
cp .env.example .env.local     # optional for local dev — see below
npm run dev                    # http://localhost:3000
```

With no environment variables at all, the app runs on the **file adapter**
(`data/cms.json`, seeded on first boot) and the dashboard accepts the local
development credentials:

```
http://localhost:3000/admin
email:    admin@nedal.local
password: nedal-dev-admin
```

Those dev defaults are refused when `NODE_ENV=production`.

### Scripts

```bash
npm run dev         # development server
npm run build       # production build
npm start           # run the production build
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
npm run smoke       # end-to-end check against a running server (see below)
npm run admin:hash -- "your-password"   # print ADMIN_PASSWORD_HASH + ADMIN_SESSION_SECRET
```

---

## Environment variables

All optional locally; the admin ones are **required in production**.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Absolute site URL — canonical/OG URLs, `sitemap.xml` |
| `ADMIN_EMAIL` | The single admin account's email |
| `ADMIN_PASSWORD_HASH` | `scrypt:<salt>:<key>` from `npm run admin:hash` |
| `ADMIN_PASSWORD` | Plain-text alternative — development only |
| `ADMIN_SESSION_SECRET` | 32+ random chars; signs the session cookie |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key; never exposed to the browser |
| `SUPABASE_MEDIA_BUCKET` | Storage bucket for uploads (default `media`) |
| `CMS_DATA_FILE` | Override the JSON file path (file adapter only) |

Set up the admin account:

```bash
npm run admin:hash -- "a-long-password"
# ADMIN_PASSWORD_HASH=scrypt:…
# ADMIN_SESSION_SECRET=…
```

---

## Database setup (Supabase)

1. Create a Supabase project.
2. Open the SQL editor and run [`supabase/schema.sql`](supabase/schema.sql). It
   creates every collection table, the `updated_at` triggers, row-level security
   (anonymous clients can read published rows only; all writes require the
   service role), the unique project-slug index and the public `media` storage
   bucket.
3. Put `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the
   environment. The app switches adapters automatically — no code changes.
4. First boot with an empty database shows empty collections; seed content by
   entering it in the dashboard, or copy `data/cms.json` values across.

### Why an adapter layer

`src/lib/cms/store.ts` defines one `CmsStore` interface. Two implementations
live in `src/lib/cms/adapters/`:

* `supabase-store.ts` — Postgres via Supabase (production).
* `json-store.ts` — a real file-backed store for local development and
  single-node hosts. It re-reads the file when it changes on disk, writes
  atomically, and reports `writable: false` (surfaced in the dashboard header)
  on a read-only filesystem. It is **not** suitable for serverless or
  multi-instance deployments — use Supabase there.

Swapping in another backend means writing one more implementation of that
interface; no page, component or form changes.

---

## Project structure

```
src/
  app/
    (site)/                 public site: /, /about, /services, /projects,
                            /projects/[slug], /clients, /contact
    admin/
      (auth)/login          sign-in
      (dashboard)/          guarded dashboard
        [collection]/       list · new · edit for every collection
        content/            hero & site copy (EN + AR)
        media/              media library
        settings/           SEO, contact, appearance, sections
      actions.ts            all server actions (auth + CRUD)
    api/contact             public inquiry endpoint (validated + sanitized)
    api/admin/media         authenticated upload endpoint
  components/
    public/                 hero, sections, navbar, footer, forms
    admin/                  shell, sidebar, generic doc form, media picker
    ui/                     container, reveal, count-up, decor, empty states
  lib/
    cms/                    types, seed data, collections config, store, queries
    auth.ts                 session + password verification
    locale.ts / i18n.ts     locale cookie, RTL direction, copy accessor
supabase/schema.sql         database + storage setup
scripts/smoke.mjs           end-to-end verification
```

The dashboard is **descriptor-driven**: `src/lib/cms/collections.ts` declares the
fields of each collection and the list/edit screens render themselves from it, so
adding a content field is a one-line change.

---

## Homepage

```
01 Hero      02 About      03 Services (vertical slider)   04 My Work
05 Skills    06 Marketing numbers (sequential carousel)    07 Clients (marquee)
08 Testimonials (image slider)   09 Articles   10 Start a project   11 Footer
```

Every section can be switched off in **Settings → Homepage sections**. Career
timeline and Tools are not on the public site; both collections remain in the
dashboard for internal use.

## Content model

`projects · articles · clients · services · skills · tools · experience ·
testimonials · metrics · social_links · navigation_items · media_assets ·
site_content · site_settings · inquiries`

Every text field that appears on the site exists in **both English and Arabic**;
an empty language falls back to the other one. Projects relate to a client and to
the services delivered by id, never by duplicated text.

### What ships seeded, and what does not

Seeded from the brief: the 16 services, the capability matrix, the five known
clients, the seven confirmed metrics, the six social links, navigation, and all
hero/section copy.

Deliberately **empty**: projects, experience, testimonials and tools. Nothing was
invented — the site renders elegant empty states until real records are entered.
The same applies to imagery: `public/images/portrait-*.svg` are placeholders.

### About section media

**Settings → Imagery → About section shows** switches the About media column
between the services pile (default) and the second portrait. The pile drops each
service name into one of two boxes, grouped by the service's own category, so
adding a service in the dashboard adds a pill with no code change.

### Articles

`/articles` and `/articles/<slug>` are CMS-powered. The body is plain text: a
blank line starts a new paragraph, and a line beginning with `## ` becomes a
heading. Featured articles surface on the homepage.

### Media storage

With Supabase configured, uploads go to its Storage bucket. Otherwise they are
written to `data/uploads/` (override with `UPLOAD_DIR`) and served by the
`/uploads/[...path]` route — *not* from `public/`, because Next only serves
`public/` files that existed when the build ran, so anything uploaded later
would 404 in production.

### Adding the real portrait

1. Sign in → **Media library** → upload the portrait(s).
2. **Settings → Imagery** → set *Hero portrait* (and optionally *Hero spotlight
   reveal*, which is revealed by the cursor spotlight) and *About portrait*.

The hero is designed for a cinematic, high-contrast editorial portrait with black
clothing and deep shadows; the layout keeps negative space for the typography and
lays the red/orange glow behind the subject.

---

## Language & RTL

**The public site** and **the dashboard** each have their own language toggle.

A cookie (`nedal_locale`) holds the reader's choice; the navbar toggle sets it and
the tree re-renders. Without a cookie the site uses the dashboard's default
language. `<html lang dir>` follows the locale, and the layout uses logical CSS
properties throughout, so Arabic mirrors correctly.

The dashboard has its own toggle in the header, backed by a separate cookie
(`nedal_admin_locale`), so the admin can work in Arabic while visitors see the
English site (or the reverse). It translates the whole chrome — sidebar,
collection and field labels, buttons, status text — and flips the layout to RTL.
Content fields always stay bilingual (EN + AR) regardless of the dashboard's
language, since both are edited side by side. Arabic UI strings live in
`src/i18n/admin.ts`; Arabic field labels live beside the English ones in
`src/lib/cms/collections.ts`.

---

## Accessibility & performance

Semantic landmarks and headings, skip link, keyboard-navigable menus, sliders
(arrow keys) and controls, visible focus rings, labelled form fields with
accessible error messages, live regions on the sliders, alt text on meaningful
images, `aria-hidden` on decoration. Only name and phone are required on the
inquiry form.

`prefers-reduced-motion` disables the hero's pointer effects, the counters and
every reveal. All pointer-driven motion runs in a single `requestAnimationFrame`
loop that is cleaned up on unmount, paused when the tab is hidden and skipped on
touch devices. Below-the-fold media is lazy-loaded.

---

## Verification

With a server running (`npm run build && npm start`):

```bash
npm run smoke
```

`scripts/smoke.mjs` drives a real browser through: every public route in both
languages, horizontal-overflow checks at 1280px and 390px, the homepage section
order, the services slider and metrics carousel advancing, the floating WhatsApp
button, the admin redirect for anonymous visitors, sign-in, the dashboard's
Arabic toggle and lime accent, creating and publishing a project and an article
(including paragraph/heading parsing) and seeing both on the public site,
unpublishing (public 404) and deleting them, uploading a media asset and
fetching its URL, the contact form's success state, and a console-error check.
It exits non-zero on the first failure.

Set `BASE_URL` to test another origin, and `ADMIN_EMAIL` / `ADMIN_PASSWORD` to use
non-default credentials.

---

## Deployment

A complete, free path (GitHub + Supabase Free + Vercel Hobby) is written up in
Arabic, step by step, in [`docs/DEPLOY-AR.md`](docs/DEPLOY-AR.md). In short:

1. Run `supabase/schema.sql` and set the Supabase variables (required — a
   serverless filesystem cannot persist the JSON adapter).
2. Set `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET` and
   `NEXT_PUBLIC_SITE_URL`.
3. `npm run build` → `npm start` (or deploy to any Next.js host).
4. Sign in at `/admin`. A fresh database shows a **Load starter content**
   button that inserts the site copy, services, skills, clients, metrics,
   social links and navigation; it only fills collections that are empty.
5. Upload the portrait and publish the first case study.

`/admin` and `/api` are excluded from `robots.txt`, and the dashboard sets
`noindex`.
