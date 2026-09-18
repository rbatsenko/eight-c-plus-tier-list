"use client";

import { useEffect, useState } from "react";
import { TIERS } from "@/lib/tiers";
import { normalizeUrl, parseVideo } from "@/lib/video";
import type { Boulder, TierId, Video } from "@/lib/types";

export default function BoulderDetail({
  boulder,
  videos,
  onAssign,
  onAddVideo,
  onRemoveVideo,
  onClose,
}: {
  boulder: Boulder;
  videos: Video[];
  onAssign: (tier: TierId | null) => void;
  onAddVideo: (url: string, label: string) => Promise<string | null>;
  onRemoveVideo: (video: Video) => Promise<string | null>;
  onClose: () => void;
}) {
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submitVideo(e: React.FormEvent) {
    e.preventDefault();
    const clean = normalizeUrl(url);
    if (!clean) {
      setError("That doesn't look like a link.");
      return;
    }
    setSaving(true);
    setError(null);
    const err = await onAddVideo(clean, label.trim());
    setSaving(false);
    if (err) setError(err);
    else {
      setUrl("");
      setLabel("");
    }
  }

  const active = playing ? videos.find((v) => v.id === playing) : undefined;
  const activeParsed = active ? parseVideo(active.url) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-rock-700 bg-rock-900 sm:rounded-2xl">
        <header className="sticky top-0 flex items-start gap-3 border-b border-rock-800 bg-rock-900/95 px-5 py-4 backdrop-blur">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-bold">{boulder.name}</h2>
            <p className="truncate text-xs text-zinc-400">
              {boulder.grade} · {boulder.area ?? "Unknown area"}
              {boulder.country ? `, ${boulder.country}` : ""}
            </p>
            {boulder.first_ascent_by ? (
              <p className="truncate text-xs text-zinc-500">
                FA {boulder.first_ascent_by}
                {boulder.first_ascent_date ? ` · ${boulder.first_ascent_date}` : ""}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-lg px-2 py-1 text-zinc-500 hover:bg-rock-800 hover:text-zinc-200"
          >
            ✕
          </button>
        </header>

        <section className="px-5 py-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
            Tier
          </h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {TIERS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onAssign(t.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  boulder.tier === t.id
                    ? `${t.swatch} ring-2 ring-white/70`
                    : "bg-rock-800 text-zinc-300 hover:bg-rock-700"
                }`}
              >
                {t.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => onAssign(null)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                boulder.tier === null
                  ? "bg-zinc-200 text-zinc-900 ring-2 ring-white/70"
                  : "bg-rock-800 text-zinc-400 hover:bg-rock-700"
              }`}
            >
              Unranked
            </button>
          </div>
        </section>

        <section className="border-t border-rock-800 px-5 py-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
            Videos {videos.length ? `(${videos.length})` : ""}
          </h3>

          {active && activeParsed?.embedUrl ? (
            <div className="mt-3 aspect-video w-full overflow-hidden rounded-lg border border-rock-700 bg-black">
              <iframe
                key={active.id}
                src={activeParsed.embedUrl}
                title={active.label ?? "Video"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          ) : null}

          <ul className="mt-3 space-y-1.5">
            {videos.map((v) => {
              const p = parseVideo(v.url);
              const canEmbed = Boolean(p.embedUrl);
              return (
                <li
                  key={v.id}
                  className="flex items-center gap-2 rounded-lg border border-rock-700 bg-rock-850 px-2.5 py-2"
                >
                  {canEmbed ? (
                    <button
                      type="button"
                      onClick={() => setPlaying(playing === v.id ? null : v.id)}
                      className="shrink-0 rounded bg-rock-700 px-2 py-1 text-[11px] text-amber-300 hover:bg-rock-600"
                    >
                      {playing === v.id ? "■" : "▶"}
                    </button>
                  ) : (
                    <span className="shrink-0 rounded bg-rock-700 px-2 py-1 text-[11px] text-zinc-500">
                      ↗
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <a
                      href={v.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-xs text-zinc-200 hover:text-amber-300 hover:underline"
                    >
                      {v.label?.trim() || v.url}
                    </a>
                    <p className="truncate text-[10px] text-zinc-600">
                      {p.host}
                      {v.added_by ? ` · ${v.added_by}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Remove video"
                    onClick={async () => {
                      const err = await onRemoveVideo(v);
                      if (err) setError(err);
                    }}
                    className="shrink-0 rounded px-1.5 py-1 text-xs text-zinc-600 hover:bg-rock-700 hover:text-rose-300"
                  >
                    ✕
                  </button>
                </li>
              );
            })}
            {videos.length === 0 ? (
              <li className="rounded-lg border border-dashed border-rock-700 px-3 py-4 text-xs text-zinc-600">
                No videos yet. Paste one so people can actually judge it.
              </li>
            ) : null}
          </ul>

          <form onSubmit={submitVideo} className="mt-3 space-y-2">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste a video link (YouTube, Vimeo, Instagram…)"
              className="w-full rounded-lg border border-rock-600 bg-rock-850 px-3 py-2 text-sm outline-none placeholder:text-zinc-600 focus:border-amber-400/70"
            />
            <div className="flex gap-2">
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Label (optional) — e.g. Ondra FA"
                className="min-w-0 flex-1 rounded-lg border border-rock-600 bg-rock-850 px-3 py-2 text-sm outline-none placeholder:text-zinc-600 focus:border-amber-400/70"
              />
              <button
                type="submit"
                disabled={saving}
                className="shrink-0 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-300 disabled:opacity-50"
              >
                {saving ? "Adding…" : "Add"}
              </button>
            </div>
          </form>

          {error ? (
            <p className="mt-2 rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
              {error}
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
}
