-- Mark boulders that have already been covered on the podcast, so the host can
-- tell what is left and return to a covered one later. Flag only: a discussed
-- boulder keeps its tier, videos and position.

alter table public.tierlist_boulders
  add column if not exists discussed boolean not null default false;

-- The Activity panel logs the toggle, which needs two new audit actions.
alter table public.tierlist_edits
  drop constraint if exists tierlist_edits_action_check;

alter table public.tierlist_edits
  add constraint tierlist_edits_action_check
  check (action in ('add','move','remove','edit','video','discussed','undiscussed'));
