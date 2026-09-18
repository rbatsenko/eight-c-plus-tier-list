"use client";

import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  TouchSensor,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ActivityFeed from "./ActivityFeed";
import AddBoulderForm, { type NewBoulder } from "./AddBoulderForm";
import BoulderDetail from "./BoulderDetail";
import { CardBody } from "./BoulderCard";
import PoolRow from "./PoolRow";
import TierRow from "./TierRow";
import { supabase, isConfigured } from "@/lib/supabase";
import {
  containerToTier,
  POOL_ID,
  TIERS,
  tierToContainer,
  type ContainerId,
} from "@/lib/tiers";
import { normalizeUrl } from "@/lib/video";
import type { Boulder, Edit, TierId, Video } from "@/lib/types";

const NAME_KEY = "8cplus.editor";

/** Sparse ordering: land between neighbours so a move touches exactly one row. */
function computePosition(list: Boulder[], index: number): number {
  const prev = index > 0 ? list[index - 1].position : null;
  const next = index < list.length ? list[index].position : null;
  if (prev === null && next === null) return 1000;
  if (prev === null) return next! - 1000;
  if (next === null) return prev + 1000;
  return (prev + next) / 2;
}

/**
 * Rect-based detection misreads a tier list: rows are wide and the dragged card's
 * own rect straddles several of them. Go by the cursor, and only fall back to
 * geometry when it is over a gap.
 */
const collisionDetection: CollisionDetection = (args) => {
  const pointer = pointerWithin(args);
  if (pointer.length > 0) return pointer;
  const intersecting = rectIntersection(args);
  if (intersecting.length > 0) return intersecting;
  return closestCorners(args);
};

function emptyGroups(): Record<ContainerId, Boulder[]> {
  return { POOL: [], S: [], A: [], B: [], C: [], D: [], TERRANOVA: [] };
}

export default function TierBoard() {
  const [boulders, setBoulders] = useState<Boulder[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [edits, setEdits] = useState<Edit[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editor, setEditor] = useState("");
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [adding, setAdding] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [showFeed, setShowFeed] = useState(false);
  const [copied, setCopied] = useState(false);

  const editorRef = useRef("");
  editorRef.current = editor;

  useEffect(() => {
    try {
      setEditor(localStorage.getItem(NAME_KEY) ?? "");
    } catch {
      /* private mode: just go anonymous */
    }
  }, []);

  function saveEditor(value: string) {
    setEditor(value);
    try {
      localStorage.setItem(NAME_KEY, value);
    } catch {
      /* ignore */
    }
  }

  // Initial load.
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const [b, v, e] = await Promise.all([
        supabase.from("tierlist_boulders").select("*").order("position"),
        supabase.from("tierlist_videos").select("*").order("created_at"),
        supabase
          .from("tierlist_edits")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(40),
      ]);
      if (cancelled) return;
      const err = b.error ?? v.error ?? e.error;
      if (err) setLoadError(err.message);
      setBoulders((b.data as Boulder[]) ?? []);
      setVideos((v.data as Video[]) ?? []);
      setEdits((e.data as Edit[]) ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Live updates, so two people arguing in Discord see the same board.
  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    const channel = client
      .channel("tierlist")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tierlist_boulders" },
        (payload) => {
          setBoulders((prev) => {
            if (payload.eventType === "DELETE") {
              return prev.filter((b) => b.id !== (payload.old as Boulder).id);
            }
            const row = payload.new as Boulder;
            const idx = prev.findIndex((b) => b.id === row.id);
            if (idx === -1) return [...prev, row];
            const next = [...prev];
            next[idx] = row;
            return next;
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tierlist_videos" },
        (payload) => {
          setVideos((prev) => {
            if (payload.eventType === "DELETE") {
              return prev.filter((v) => v.id !== (payload.old as Video).id);
            }
            const row = payload.new as Video;
            if (prev.some((v) => v.id === row.id)) return prev;
            return [...prev, row];
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "tierlist_edits" },
        (payload) => {
          const row = payload.new as Edit;
          setEdits((prev) =>
            prev.some((e) => e.id === row.id) ? prev : [row, ...prev].slice(0, 40),
          );
        },
      )
      .subscribe();
    return () => {
      client.removeChannel(channel);
    };
  }, []);

  const grouped = useMemo(() => {
    const g = emptyGroups();
    for (const b of boulders) g[tierToContainer(b.tier)].push(b);
    for (const key of Object.keys(g) as ContainerId[]) {
      g[key].sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));
    }
    return g;
  }, [boulders]);

  const videoCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const v of videos) counts[v.boulder_id] = (counts[v.boulder_id] ?? 0) + 1;
    return counts;
  }, [videos]);

  const logEdit = useCallback(
    async (row: {
      boulder_id: string | null;
      boulder_name: string;
      action: Edit["action"];
      from_tier?: string | null;
      to_tier?: string | null;
    }) => {
      if (!supabase) return;
      await supabase.from("tierlist_edits").insert({
        ...row,
        editor: editorRef.current.trim() || null,
      });
    },
    [],
  );

  const persistMove = useCallback(
    async (boulder: Boulder, tier: TierId | null, position: number, from: TierId | null) => {
      if (!supabase) return;
      const { error } = await supabase
        .from("tierlist_boulders")
        .update({ tier, position })
        .eq("id", boulder.id);
      if (error) {
        setLoadError(error.message);
        return;
      }
      if (from !== tier) {
        await logEdit({
          boulder_id: boulder.id,
          boulder_name: boulder.name,
          action: "move",
          from_tier: from,
          to_tier: tier,
        });
      }
    },
    [logEdit],
  );

  const findContainer = useCallback(
    (id: UniqueIdentifier): ContainerId | null => {
      if (id === POOL_ID || TIERS.some((t) => t.id === id)) return id as ContainerId;
      const b = boulders.find((x) => x.id === id);
      return b ? tierToContainer(b.tier) : null;
    },
    [boulders],
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    const boulder = boulders.find((b) => b.id === active.id);
    if (!boulder) return;
    const origin = boulder.tier;
    const container = over ? findContainer(over.id) : tierToContainer(boulder.tier);
    if (!container) return;

    const tier = containerToTier(container);
    const list = grouped[container].filter((b) => b.id !== boulder.id);
    let index = list.length;
    if (over && over.id !== container) {
      const i = list.findIndex((b) => b.id === over.id);
      if (i !== -1) index = i;
    }
    const position = computePosition(list, index);

    setBoulders((prev) =>
      prev.map((b) => (b.id === boulder.id ? { ...b, tier, position } : b)),
    );
    void persistMove(boulder, tier, position, origin);
  }

  const assignTier = useCallback(
    (boulder: Boulder, tier: TierId | null) => {
      const container = tierToContainer(tier);
      const list = grouped[container].filter((b) => b.id !== boulder.id);
      const position = computePosition(list, list.length);
      const from = boulder.tier;
      setBoulders((prev) =>
        prev.map((b) => (b.id === boulder.id ? { ...b, tier, position } : b)),
      );
      void persistMove(boulder, tier, position, from);
    },
    [grouped, persistMove],
  );

  async function addBoulder(form: NewBoulder): Promise<string | null> {
    if (!supabase) return "Not connected to the database.";
    const { data, error } = await supabase
      .from("tierlist_boulders")
      .insert({
        name: form.name.trim(),
        area: form.area.trim() || null,
        country: form.country.trim() || null,
        first_ascent_by: form.first_ascent_by.trim() || null,
        first_ascent_date: form.first_ascent_date.trim() || null,
        grade: form.grade.trim() || "8C+",
        position: Math.max(0, ...boulders.map((b) => b.position)) + 1000,
      })
      .select()
      .single();

    if (error) {
      return error.code === "23505"
        ? "That boulder is already on the list."
        : error.message;
    }

    const row = data as Boulder;
    setBoulders((prev) => (prev.some((b) => b.id === row.id) ? prev : [...prev, row]));
    await logEdit({ boulder_id: row.id, boulder_name: row.name, action: "add" });

    const videoUrl = normalizeUrl(form.video_url);
    if (videoUrl) await addVideo(row.id, videoUrl, "");
    return null;
  }

  async function addVideo(
    boulderId: string,
    url: string,
    label: string,
  ): Promise<string | null> {
    if (!supabase) return "Not connected to the database.";
    const { data, error } = await supabase
      .from("tierlist_videos")
      .insert({
        boulder_id: boulderId,
        url,
        label: label.trim() || null,
        added_by: editorRef.current.trim() || null,
      })
      .select()
      .single();

    if (error) {
      return error.code === "23505" ? "That link is already here." : error.message;
    }
    const row = data as Video;
    setVideos((prev) => (prev.some((v) => v.id === row.id) ? prev : [...prev, row]));
    const boulder = boulders.find((b) => b.id === boulderId);
    await logEdit({
      boulder_id: boulderId,
      boulder_name: boulder?.name ?? "a boulder",
      action: "video",
    });
    return null;
  }

  async function removeVideo(video: Video): Promise<string | null> {
    if (!supabase) return "Not connected to the database.";
    const { error, count } = await supabase
      .from("tierlist_videos")
      .delete({ count: "exact" })
      .eq("id", video.id);
    if (error) return error.message;
    if (!count) return "Links can only be removed within an hour of being added.";
    setVideos((prev) => prev.filter((v) => v.id !== video.id));
    return null;
  }

  async function copyForDiscord() {
    const lines = [`**8C+ Tier List** — ${window.location.href}`, ""];
    for (const t of TIERS) {
      const names = grouped[t.id].map((b) => b.name);
      lines.push(`**${t.label}** — ${names.length ? names.join(", ") : "_empty_"}`);
    }
    const pool = grouped[POOL_ID];
    if (pool.length) lines.push("", `_Unranked (${pool.length}): ${pool.map((b) => b.name).join(", ")}_`);
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setLoadError("Couldn't reach the clipboard. Copy from the page instead.");
    }
  }

  const sensors = useSensors(
    // A small threshold keeps taps working as taps.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const activeBoulder = activeId ? boulders.find((b) => b.id === activeId) : undefined;
  const openBoulder = openId ? boulders.find((b) => b.id === openId) : undefined;
  const ranked = boulders.filter((b) => b.tier !== null).length;

  if (!isConfigured) {
    return (
      <main className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="text-2xl font-bold">8C+ Tier List</h1>
        <p className="mt-3 text-sm text-zinc-400">
          Not connected to a database yet. Set{" "}
          <code className="rounded bg-rock-800 px-1">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="rounded bg-rock-800 px-1">
            NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
          </code>
          , then redeploy.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-3 py-6 sm:px-6 sm:py-10">
      <header className="mb-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              8C+ Tier List
            </h1>
            <p className="mt-1 text-xs text-zinc-500 sm:text-sm">
              Every 8C+ boulder in the world. Drag them, paste videos, argue.{" "}
              <span className="text-zinc-600">
                Anyone can edit — {ranked}/{boulders.length} ranked.
              </span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={editor}
              onChange={(e) => saveEditor(e.target.value.slice(0, 40))}
              placeholder="Your name"
              aria-label="Your name, shown on edits"
              className="w-28 rounded-lg border border-rock-600 bg-rock-850 px-2.5 py-1.5 text-xs outline-none placeholder:text-zinc-600 focus:border-amber-400/70 sm:w-36"
            />
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-semibold text-amber-950 hover:bg-amber-300"
            >
              + Boulder
            </button>
            <button
              type="button"
              onClick={copyForDiscord}
              className="rounded-lg border border-rock-600 px-3 py-1.5 text-xs text-zinc-300 hover:bg-rock-800"
            >
              {copied ? "Copied ✓" : "Copy for Discord"}
            </button>
            <button
              type="button"
              onClick={() => setShowFeed((v) => !v)}
              className="rounded-lg border border-rock-600 px-3 py-1.5 text-xs text-zinc-300 hover:bg-rock-800"
            >
              {showFeed ? "Hide activity" : "Activity"}
            </button>
          </div>
        </div>

        {loadError ? (
          <p className="mt-3 rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
            {loadError}
          </p>
        ) : null}
      </header>

      {showFeed ? (
        <div className="mb-5 overflow-hidden rounded-xl border border-rock-700 bg-rock-900/70">
          <ActivityFeed edits={edits} />
        </div>
      ) : null}

      {loading ? (
        <p className="py-20 text-center text-sm text-zinc-600">Loading the list…</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <div className="space-y-2">
            {TIERS.map((t) => (
              <TierRow
                key={t.id}
                tier={t}
                boulders={grouped[t.id]}
                videoCounts={videoCounts}
                onOpen={(b) => setOpenId(b.id)}
              />
            ))}
          </div>

          <div className="mt-6">
            <PoolRow
              boulders={grouped[POOL_ID]}
              videoCounts={videoCounts}
              onOpen={(b) => setOpenId(b.id)}
            />
          </div>

          <DragOverlay dropAnimation={null}>
            {activeBoulder ? (
              <CardBody
                boulder={activeBoulder}
                videoCount={videoCounts[activeBoulder.id] ?? 0}
                dragging
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <footer className="mt-10 border-t border-rock-800 pt-4 text-[11px] leading-relaxed text-zinc-600">
        <p>
          Boulder data from{" "}
          <a
            href="https://climbing-history.org/hardest?discipline=boulder&grade=8C%2B"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-zinc-400"
          >
            climbing-history.org
          </a>
          . Corrections to the underlying data belong upstream at
          corrections@climbing-history.org.
        </p>
        <p className="mt-1">
          Tiers are whatever the internet last decided. Nothing here is a real grade.
        </p>
      </footer>

      {adding ? (
        <AddBoulderForm onSubmit={addBoulder} onClose={() => setAdding(false)} />
      ) : null}

      {openBoulder ? (
        <BoulderDetail
          boulder={openBoulder}
          videos={videos
            .filter((v) => v.boulder_id === openBoulder.id)
            .sort((a, b) => a.created_at.localeCompare(b.created_at))}
          onAssign={(t) => assignTier(openBoulder, t)}
          onAddVideo={(url, label) => addVideo(openBoulder.id, url, label)}
          onRemoveVideo={removeVideo}
          onClose={() => setOpenId(null)}
        />
      ) : null}
    </main>
  );
}
