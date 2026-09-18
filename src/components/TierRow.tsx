"use client";

import { useDroppable } from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import BoulderCard from "./BoulderCard";
import type { TierDef } from "@/lib/tiers";
import type { Boulder } from "@/lib/types";

export default function TierRow({
  tier,
  boulders,
  videoCounts,
  onOpen,
}: {
  tier: TierDef;
  boulders: Boulder[];
  videoCounts: Record<string, number>;
  onOpen: (boulder: Boulder) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: tier.id });

  return (
    <section
      className={`flex overflow-hidden rounded-xl border bg-rock-900/70 transition-colors ${
        isOver ? "border-amber-400/70 bg-rock-850" : "border-rock-700"
      }`}
    >
      <div
        className={`flex w-16 shrink-0 items-center justify-center px-1.5 py-3 text-center sm:w-24 ${tier.swatch}`}
      >
        <span
          className={`font-black leading-none tracking-tight ${
            tier.label.length > 2 ? "text-xs sm:text-base" : "text-xl sm:text-3xl"
          }`}
        >
          {tier.label}
        </span>
      </div>

      <div ref={setNodeRef} className="min-h-24 flex-1 p-2">
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
                Drop boulders here
              </p>
            ) : null}
          </div>
        </SortableContext>
      </div>
    </section>
  );
}
