import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/**
 * Null when the app has not been pointed at a Supabase project yet, so the UI can
 * say so instead of throwing on first render.
 */
export const supabase =
  url && key
    ? createClient(url, key, {
        auth: { persistSession: false },
        realtime: { params: { eventsPerSecond: 10 } },
      })
    : null;

export const isConfigured = Boolean(url && key);
