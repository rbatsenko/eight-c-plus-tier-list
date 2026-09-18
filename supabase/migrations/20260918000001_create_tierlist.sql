-- Public, anonymously-editable 8C+ boulder tier list.

create table if not exists public.tierlist_boulders (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  area               text,
  country            text,
  first_ascent_by    text,
  first_ascent_date  text,
  grade              text not null default '8C+',
  tier               text,
  position           double precision not null default 1000,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint tierlist_boulders_tier_check
    check (tier is null or tier in ('S','A','B','C','D','TERRANOVA')),
  constraint tierlist_boulders_name_len check (char_length(name) between 1 and 120),
  constraint tierlist_boulders_area_len check (area is null or char_length(area) <= 120),
  constraint tierlist_boulders_country_len check (country is null or char_length(country) <= 80),
  constraint tierlist_boulders_fa_len check (first_ascent_by is null or char_length(first_ascent_by) <= 120),
  constraint tierlist_boulders_fadate_len check (first_ascent_date is null or char_length(first_ascent_date) <= 40),
  constraint tierlist_boulders_grade_len check (char_length(grade) <= 12)
);

create unique index if not exists tierlist_boulders_unique_name_area
  on public.tierlist_boulders (lower(name), lower(coalesce(area, '')));

create index if not exists tierlist_boulders_tier_position_idx
  on public.tierlist_boulders (tier, position);

create table if not exists public.tierlist_videos (
  id         uuid primary key default gen_random_uuid(),
  boulder_id uuid not null references public.tierlist_boulders(id) on delete cascade,
  url        text not null,
  label      text,
  added_by   text,
  created_at timestamptz not null default now(),
  constraint tierlist_videos_url_len   check (char_length(url) between 8 and 500),
  constraint tierlist_videos_url_http  check (url ~* '^https?://'),
  constraint tierlist_videos_label_len check (label is null or char_length(label) <= 120),
  constraint tierlist_videos_added_len check (added_by is null or char_length(added_by) <= 40)
);

create index if not exists tierlist_videos_boulder_idx on public.tierlist_videos (boulder_id, created_at);
create unique index if not exists tierlist_videos_unique_url on public.tierlist_videos (boulder_id, url);

create table if not exists public.tierlist_edits (
  id           bigint generated always as identity primary key,
  boulder_id   uuid references public.tierlist_boulders(id) on delete set null,
  boulder_name text not null,
  action       text not null check (action in ('add','move','remove','edit','video')),
  from_tier    text,
  to_tier      text,
  editor       text,
  created_at   timestamptz not null default now(),
  constraint tierlist_edits_editor_len check (editor is null or char_length(editor) <= 40)
);

create index if not exists tierlist_edits_created_at_idx on public.tierlist_edits (created_at desc);

create or replace function public.tierlist_touch_updated_at()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists tierlist_boulders_touch on public.tierlist_boulders;
create trigger tierlist_boulders_touch
  before update on public.tierlist_boulders
  for each row execute function public.tierlist_touch_updated_at();

alter table public.tierlist_boulders enable row level security;
alter table public.tierlist_videos   enable row level security;
alter table public.tierlist_edits    enable row level security;

create policy tierlist_boulders_read   on public.tierlist_boulders for select to anon, authenticated using (true);
create policy tierlist_boulders_insert on public.tierlist_boulders for insert to anon, authenticated with check (true);
create policy tierlist_boulders_update on public.tierlist_boulders for update to anon, authenticated using (true) with check (true);
create policy tierlist_boulders_delete on public.tierlist_boulders for delete to anon, authenticated
  using (created_at > now() - interval '1 hour');

create policy tierlist_videos_read   on public.tierlist_videos for select to anon, authenticated using (true);
create policy tierlist_videos_insert on public.tierlist_videos for insert to anon, authenticated with check (true);
create policy tierlist_videos_delete on public.tierlist_videos for delete to anon, authenticated
  using (created_at > now() - interval '1 hour');

create policy tierlist_edits_read   on public.tierlist_edits for select to anon, authenticated using (true);
create policy tierlist_edits_insert on public.tierlist_edits for insert to anon, authenticated with check (true);

alter publication supabase_realtime add table public.tierlist_boulders;
alter publication supabase_realtime add table public.tierlist_videos;
alter publication supabase_realtime add table public.tierlist_edits;

-- Required: Realtime re-checks RLS against the old row on UPDATE/DELETE, and with
-- the default replica identity it only gets the primary key and drops the event.
alter table public.tierlist_boulders replica identity full;
alter table public.tierlist_videos   replica identity full;
alter table public.tierlist_edits    replica identity full;
