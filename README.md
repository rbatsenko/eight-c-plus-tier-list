# 8C+ Tier List

A public, collaboratively edited tier list of every 8C+ boulder problem in the
world. No accounts, no login — open the page and drag. It exists because this
argument was scattered across a hundred Discord messages.

**Tiers:** S · A · B · C · D · Terranova

## What you can do

- **Drag** a boulder into a tier, or open it and pick one (better on a phone).
- **Paste videos.** Every boulder holds as many beta links as you want, so
  people can actually watch the thing before voting on it. YouTube and Vimeo
  play inline; anything else becomes a link.
- **Add boulders** that are missing. New entries show up for everyone instantly.
- **Copy for Discord** dumps the current board as formatted text.
- **Activity** shows who moved what, so a board-wipe is at least attributable.

Everything is live: two people with the page open see each other's moves without
refreshing.

## Stack

Next.js (App Router) + Tailwind, `@dnd-kit` for dragging, and Supabase for
storage and realtime. There is no server-side code — the browser talks to
Supabase directly, and row level security is what keeps the blast radius small.

## Local development

```bash
pnpm install
cp .env.example .env.local   # fill in the two values
pnpm dev
```

Both env vars are public by design. The Supabase publishable key is meant to sit
in the browser; what a visitor may do is decided by the RLS policies in
`supabase/migrations/`, not by hiding the key.

| Variable                               | Meaning                       |
| -------------------------------------- | ----------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase project URL          |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key      |

## Anyone can edit — really?

Yes, and that is the point. The guard rails are deliberately mild:

- Inserts and placement updates are open to anonymous visitors.
- Deletes only work on rows less than an hour old, so you can undo your own
  mistake but cannot clear the board.
- `tierlist_edits` is append-only from the client, so the history survives even
  if someone reshuffles everything.

If it ever gets abused, the realistic fix is to tighten the policies in Supabase
rather than to add a login.

## Data

The boulder list comes from
[climbing-history.org](https://climbing-history.org/hardest?discipline=boulder&grade=8C%2B)
(entries #16–#85 of their hardest-boulders ranking). One entry has no country
recorded because the crag alone did not settle it — `Maxwell's Demon Low` at
Secret Garden.

Corrections to the *underlying* facts belong upstream at
`corrections@climbing-history.org`, not here. Please do not scrape that site;
they ask that bulk data requests go to `data@climbing-history.org`.

Tiers here are opinion. Nothing on this page is a grade.
