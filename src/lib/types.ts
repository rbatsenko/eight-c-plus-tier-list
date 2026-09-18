export type TierId = "S" | "A" | "B" | "C" | "D" | "TERRANOVA";

export type Boulder = {
  id: string;
  name: string;
  area: string | null;
  country: string | null;
  first_ascent_by: string | null;
  first_ascent_date: string | null;
  grade: string;
  /** null means the boulder is still in the unranked pool. */
  tier: TierId | null;
  position: number;
  created_at: string;
  updated_at: string;
};

export type Video = {
  id: string;
  boulder_id: string;
  url: string;
  label: string | null;
  added_by: string | null;
  created_at: string;
};

export type Edit = {
  id: number;
  boulder_id: string | null;
  boulder_name: string;
  action: "add" | "move" | "remove" | "edit" | "video";
  from_tier: string | null;
  to_tier: string | null;
  editor: string | null;
  created_at: string;
};
