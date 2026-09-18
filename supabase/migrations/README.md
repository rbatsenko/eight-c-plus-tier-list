# Database

The tier list lives in the **Beta Rocks** Supabase project, in three
`tierlist_`-prefixed tables in the `public` schema. They are namespaced rather
than given their own schema so PostgREST can serve them without extra config;
row level security is per-table, so the public write policies here do not touch
any other table in that project.

| Table               | Purpose                                                |
| ------------------- | ------------------------------------------------------ |
| `tierlist_boulders` | One row per boulder. `tier = null` means unranked.      |
| `tierlist_videos`   | Beta links people paste while arguing. Many per boulder.|
| `tierlist_edits`    | Append-only audit trail shown in the Activity panel.    |

## Policies

Anonymous visitors can read everything, insert boulders and videos, and update
boulder placements. Deletes are deliberately limited to rows created in the last
hour — enough to undo your own mistake, not enough to wipe the board. There is
no delete policy on `tierlist_edits` at all, so the history cannot be rewritten
from the client.

## Ordering

`position` is a sparse float. A move lands halfway between its new neighbours,
so re-ordering writes exactly one row instead of renumbering a whole tier.

## Realtime

All three tables are in the `supabase_realtime` publication **and** set to
`REPLICA IDENTITY FULL`. The latter is not optional: Realtime re-checks RLS
against the old row on UPDATE and DELETE, and with the default replica identity
it only receives the primary key and silently drops the event.

The migrations in this directory are a record of what was applied through the
Supabase API; they have not been run through the Supabase CLI.
