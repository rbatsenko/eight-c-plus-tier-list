"use client";

import { useDroppable } from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import BoulderCard from "./BoulderCard";
import { POOL_ID } from "@/lib/tiers";
import type { Boulder } from "@/lib/types";

export default function PoolRow({
  boulders,
  videoCounts,
  onOpen,
}: {
  boulders: Boulder[];
  videoCounts: Record<string, number>;
  onOpen: (boulder: Boulder) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: POOL_ID });

  return (
    <section
      className={`rounded-xl border bg-rock-900/40 transition-colors ${
        isOver ? "border-amber-400/70 bg-rock-850" : "border-rock-700"
      }`}
    >
      <header className="flex items-baseline justify-between px-3 pt-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Unranked
        </h2>
        <span className="text-xs text-zinc-600">{boulders.length} left</span>
      </header>
      <div ref={setNodeRef} className="min-h-24 p-2">
        <SortableContext
          items={boulders.map((b) => b.id)}
          strategy={rectSortingStrategy}
        >
          <div className="flex flex-wrap gap-2">
            {boulders.map((b) => (
              <BoulderCard
                key={b.id}
                boulder={b}
                videoCount={videoCounts[b.id] ?? 0}
                onOpen={() => onOpen(b)}
              />
            ))}
            {boulders.length === 0 ? (
              <p className="px-2 py-6 text-xs text-zinc-600">
                Everything is ranked. Bold.
              </p>
            ) : null}
          </div>
        </SortableContext>
      </div>
    </section>
  );
}
