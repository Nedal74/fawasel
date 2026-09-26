-- NEDAL ELABID — CMS schema
--
-- Every collection uses the same envelope: id / created_at / updated_at / data
-- (jsonb). Columns that Postgres needs for indexes or row-level security are
-- generated from the JSON, so the app has a single mapping path and adding a
-- content field never needs a migration.
--
-- Run this once in the Supabase SQL editor, then set:
--   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

create extension if not exists "pgcrypto";

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Generic collection table -------------------------------------------------
create or replace procedure create_cms_table(table_name text) as $$
begin
  execute format($f$
    create table if not exists public.%I (
      id uuid primary key default gen_random_uuid(),
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      data jsonb not null default '{}'::jsonb,
      published boolean generated always as (coalesce((data->>'published')::boolean, true)) stored,
      sort_order int generated always as (coalesce((data->>'order')::int, 0)) stored
    );
  $f$, table_name);

  execute format('drop trigger if exists %I on public.%I', table_name || '_updated_at', table_name);
  execute format(
    'create trigger %I before update on public.%I for each row execute function set_updated_at()',
    table_name || '_updated_at', table_name);

  execute format('alter table public.%I enable row level security', table_name);

  -- Anonymous clients may read published rows only; all writes require the
  -- service role, which is used exclusively on the server.
  execute format('drop policy if exists %I on public.%I', table_name || '_read_published', table_name);
  execute format(
    'create policy %I on public.%I for select using (published)',
    table_name || '_read_published', table_name);
end;
$$ language plpgsql;

call create_cms_table('projects');
call create_cms_table('articles');
call create_cms_table('clients');
call create_cms_table('services');
call create_cms_table('skills');
call create_cms_table('tools');
call create_cms_table('experience');
call create_cms_table('testimonials');
call create_cms_table('metrics');
call create_cms_table('social_links');
call create_cms_table('navigation_items');
call create_cms_table('media_assets');
call create_cms_table('site_content');
call create_cms_table('site_settings');
call create_cms_table('admins');
-- Chatbot: the scripted flow (one row) and the knowledge base it answers from.
call create_cms_table('chatbot');
call create_cms_table('chat_knowledge');

-- Inquiries hold personal data: never publicly readable.
call create_cms_table('inquiries');
drop policy if exists inquiries_read_published on public.inquiries;

-- Uniqueness / lookup indexes ----------------------------------------------
create unique index if not exists projects_slug_key
  on public.projects ((data->>'slug'));
create unique index if not exists articles_slug_key
  on public.articles ((data->>'slug'));
create index if not exists articles_date_idx
  on public.articles ((data->>'date') desc);
create index if not exists projects_featured_idx
  on public.projects (((data->>'featured')::boolean));
create unique index if not exists site_content_key_key
  on public.site_content ((data->>'key'));
create index if not exists media_assets_created_idx
  on public.media_assets (created_at desc);

-- Storage bucket for the media library --------------------------------------
-- Guarded so the file also runs on a plain Postgres (no `storage` schema).
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    execute $q$
      insert into storage.buckets (id, name, public)
      values ('media', 'media', true)
      on conflict (id) do nothing
    $q$;

    -- Public read of media; uploads go through the server (service role).
    execute $q$drop policy if exists "media public read" on storage.objects$q$;
    execute $q$
      create policy "media public read" on storage.objects
        for select using (bucket_id = 'media')
    $q$;
  end if;
end $$;

-- ===========================================================================
-- Analytics, leads and chatbot records (added with the Growth dashboard)
-- ===========================================================================
--
-- Written by the server when visitors browse, submit the contact form or use
-- the chatbot; read only by the dashboard. RLS is enabled with NO policies, so
-- the public (anon) key can neither read nor write these tables — only the
-- server's service-role key can. No IP addresses or cookies are stored.

create table if not exists public.analytics_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  session_id text not null default '',
  type text not null,
  path text not null default '/',
  source text not null default 'direct',
  referrer text not null default '',
  device text not null default '',
  locale text not null default '',
  country text not null default '',
  label text not null default ''
);
create index if not exists analytics_events_created_idx on public.analytics_events (created_at);
create index if not exists analytics_events_type_created_idx on public.analytics_events (type, created_at);
alter table public.analytics_events enable row level security;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null default '',
  phone text not null default '',
  email text not null default '',
  message text not null default '',
  page text not null default '',
  source text not null default '',
  origin text not null default 'contact_form',
  conversation_id uuid,
  handled boolean not null default false
);
create index if not exists leads_created_idx on public.leads (created_at desc);
drop trigger if exists leads_updated_at on public.leads;
create trigger leads_updated_at before update on public.leads
  for each row execute function set_updated_at();
alter table public.leads enable row level security;

create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  session_id text not null default '',
  locale text not null default '',
  page text not null default '',
  source text not null default '',
  device text not null default '',
  messages jsonb not null default '[]'::jsonb,
  is_lead boolean not null default false,
  outcome text not null default '',
  lead_id uuid
);
create index if not exists chat_conversations_created_idx on public.chat_conversations (created_at desc);
drop trigger if exists chat_conversations_updated_at on public.chat_conversations;
create trigger chat_conversations_updated_at before update on public.chat_conversations
  for each row execute function set_updated_at();
alter table public.chat_conversations enable row level security;

create table if not exists public.chat_unanswered (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  question text not null,
  locale text not null default '',
  page text not null default '',
  conversation_id uuid,
  resolved boolean not null default false
);
create index if not exists chat_unanswered_created_idx on public.chat_unanswered (created_at desc);
alter table public.chat_unanswered enable row level security;

-- Belt and braces: the browser-facing roles get no table privileges at all.
-- (Guarded so the file also runs on a plain Postgres without Supabase roles.)
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon')
     and exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on public.analytics_events, public.leads, public.chat_conversations, '
         || 'public.chat_unanswered from anon, authenticated';
  end if;
end $$;
