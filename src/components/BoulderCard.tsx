"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Boulder } from "@/lib/types";

const FLAGS: Record<string, string> = {
  Italy: "🇮🇹",
  USA: "🇺🇸",
  "Czech Republic": "🇨🇿",
  Japan: "🇯🇵",
  France: "🇫🇷",
  Switzerland: "🇨🇭",
  UK: "🇬🇧",
  Spain: "🇪🇸",
  Austria: "🇦🇹",
  Germany: "🇩🇪",
  Norway: "🇳🇴",
  Finland: "🇫🇮",
  Sweden: "🇸🇪",
  Australia: "🇦🇺",
  Canada: "🇨🇦",
  Russia: "🇷🇺",
  Poland: "🇵🇱",
  Portugal: "🇵🇹",
  "South Korea": "🇰🇷",
  Brazil: "🇧🇷",
  "South Africa": "🇿🇦",
};

export function CardBody({
  boulder,
  videoCount,
  dragging = false,
}: {
  boulder: Boulder;
  videoCount: number;
  dragging?: boolean;
}) {
  const flag = boulder.country ? FLAGS[boulder.country] : undefined;
  return (
    <div
      className={`w-40 rounded-lg border border-rock-600 bg-rock-800 px-2.5 py-2 text-left shadow-lg shadow-black/40 transition-colors hover:border-rock-500 sm:w-44 ${
        dragging ? "rotate-2 ring-2 ring-amber-400/70" : ""
      }`}
    >
      <div className="flex items-start gap-1">
        <p className="min-w-0 flex-1 text-[13px] font-semibold leading-snug text-zinc-50">
          {boulder.name}
        </p>
        {videoCount > 0 ? (
          <span
            title={`${videoCount} video${videoCount === 1 ? "" : "s"}`}
            className="shrink-0 rounded bg-rock-700 px-1 text-[10px] font-medium leading-4 text-amber-300"
          >
            ▶ {videoCount}
          </span>
        ) : null}
      </div>
      <p className="mt-1 truncate text-[11px] text-zinc-400">
        {flag ? `${flag} ` : ""}
        {boulder.area ?? "Unknown area"}
      </p>
      {boulder.first_ascent_by ? (
        <p className="mt-0.5 truncate text-[10px] text-zinc-500">
          FA {boulder.first_ascent_by}
          {boulder.first_ascent_date ? ` · ${boulder.first_ascent_date}` : ""}
        </p>
      ) : (
        <p className="mt-0.5 truncate text-[10px] text-zinc-600">FA unrecorded</p>
      )}
    </div>
  );
}

export default function BoulderCard({
  boulder,
  videoCount,
  onOpen,
}: {
  boulder: Boulder;
  videoCount: number;
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: boulder.id });

  return (
    <button
      type="button"
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      onClick={onOpen}
      aria-label={`${boulder.name}. Open details, videos and tier.`}
      className={`dnd-draggable cursor-grab rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 active:cursor-grabbing ${
        isDragging ? "opacity-30" : ""
      }`}
      {...attributes}
      {...listeners}
    >
      <CardBody boulder={boulder} videoCount={videoCount} />
    </button>
  );
}
