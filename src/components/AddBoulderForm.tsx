"use client";

import { useState } from "react";

export type NewBoulder = {
  name: string;
  area: string;
  country: string;
  first_ascent_by: string;
  first_ascent_date: string;
  grade: string;
  video_url: string;
};

const EMPTY: NewBoulder = {
  name: "",
  area: "",
  country: "",
  first_ascent_by: "",
  first_ascent_date: "",
  grade: "8C+",
  video_url: "",
};

const FIELDS: { key: keyof NewBoulder; label: string; placeholder: string }[] = [
  { key: "name", label: "Name", placeholder: "Burden of Dreams" },
  { key: "area", label: "Area", placeholder: "Lappnor" },
  { key: "country", label: "Country", placeholder: "Finland" },
  { key: "first_ascent_by", label: "First ascent by", placeholder: "Nalle Hukkataival" },
  { key: "first_ascent_date", label: "FA date", placeholder: "24 Oct 2016" },
  { key: "grade", label: "Grade", placeholder: "8C+" },
  { key: "video_url", label: "Video link (optional)", placeholder: "https://youtube.com/watch?v=..." },
];

export default function AddBoulderForm({
  onSubmit,
  onClose,
}: {
  onSubmit: (b: NewBoulder) => Promise<string | null>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<NewBoulder>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("A name is the one thing we really need.");
      return;
    }
    setSaving(true);
    setError(null);
    const err = await onSubmit(form);
    setSaving(false);
    if (err) setError(err);
    else onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4">
      <form
        onSubmit={handleSubmit}
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-rock-700 bg-rock-900 p-5 sm:rounded-2xl"
      >
        <h2 className="text-lg font-bold">Add a boulder</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Missing something? Add it and it shows up for everyone immediately.
        </p>

        <div className="mt-4 space-y-3">
          {FIELDS.map((f) => (
            <label key={f.key} className="block">
              <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                {f.label}
              </span>
              <input
                value={form[f.key]}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [f.key]: e.target.value }))
                }
                placeholder={f.placeholder}
                autoFocus={f.key === "name"}
                className="w-full rounded-lg border border-rock-600 bg-rock-850 px-3 py-2 text-sm outline-none placeholder:text-zinc-600 focus:border-amber-400/70"
              />
            </label>
          ))}
        </div>

        {error ? (
          <p className="mt-3 rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-rock-600 px-4 py-2 text-sm text-zinc-300 hover:bg-rock-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-300 disabled:opacity-50"
          >
            {saving ? "Adding…" : "Add boulder"}
          </button>
        </div>
      </form>
    </div>
  );
}
