"use client";

import type { Edit } from "@/lib/types";

function relative(iso: string): string {
  const secs = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

function describe(e: Edit): string {
  switch (e.action) {
    case "add":
      return `added ${e.boulder_name}`;
    case "remove":
      return `removed ${e.boulder_name}`;
    case "move":
      return `moved ${e.boulder_name} to ${e.to_tier ?? "Unranked"}`;
    default:
      return `edited ${e.boulder_name}`;
  }
}

export default function ActivityFeed({ edits }: { edits: Edit[] }) {
  if (edits.length === 0) {
    return (
      <p className="px-3 py-4 text-xs text-zinc-600">
        No edits yet. Be the one who starts the argument.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-rock-800">
      {edits.map((e) => (
        <li key={e.id} className="flex gap-2 px-3 py-2 text-xs">
          <span className="shrink-0 font-medium text-amber-300/90">
            {e.editor?.trim() || "someone"}
          </span>
          <span className="min-w-0 flex-1 text-zinc-400">{describe(e)}</span>
          <span className="shrink-0 text-zinc-600">{relative(e.created_at)}</span>
        </li>
      ))}
    </ul>
  );
}
