-- Mark boulders that have already been covered on the podcast, so the host can
-- tell what is left and return to a covered one later. Flag only: a discussed
-- boulder keeps its tier, videos and position.

alter table public.tierlist_boulders
  add column if not exists discussed boolean not null default false;

-- The Activity panel logs the toggle, which needs two new audit actions.
-- The original check was declared inline, so find it by definition rather than
-- trusting the auto-generated name, then replace it with a named one.
do $$
declare
  existing text;
begin
  for existing in
    select c.conname
    from pg_constraint c
    where c.conrelid = 'public.tierlist_edits'::regclass
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) like '%action%'
  loop
    execute format('alter table public.tierlist_edits drop constraint %I', existing);
  end loop;
end
$$;

alter table public.tierlist_edits
  add constraint tierlist_edits_action_check
  check (action in ('add','move','remove','edit','video','discussed','undiscussed'));
