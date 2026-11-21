-- NEDAL ELABID — Service landing pages
--
-- For a database that already ran supabase/schema.sql: paste this whole file
-- into Supabase → SQL Editor → New query → Run. It only ADDS one table; it
-- never drops or changes existing data, and is safe to run twice.
-- (Running the full supabase/schema.sql again has the same effect.)

create extension if not exists "pgcrypto";

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Same envelope as every other collection: id / created_at / updated_at / data.
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

call create_cms_table('landing_pages');

create unique index if not exists landing_pages_slug_key
  on public.landing_pages ((data->>'slug'));
