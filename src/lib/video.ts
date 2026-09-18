export type ParsedVideo = {
  kind: "youtube" | "vimeo" | "instagram" | "other";
  /** Embeddable src, when the host allows it. */
  embedUrl: string | null;
  thumbnailUrl: string | null;
  host: string;
};

function youtubeId(u: URL): string | null {
  if (u.hostname.endsWith("youtu.be")) return u.pathname.slice(1) || null;
  if (!u.hostname.endsWith("youtube.com")) return null;
  if (u.pathname === "/watch") return u.searchParams.get("v");
  const m = u.pathname.match(/^\/(embed|shorts|live)\/([^/?]+)/);
  return m ? m[2] : null;
}

export function parseVideo(raw: string): ParsedVideo {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return { kind: "other", embedUrl: null, thumbnailUrl: null, host: "link" };
  }
  const host = u.hostname.replace(/^www\./, "");

  const yt = youtubeId(u);
  if (yt && /^[\w-]{6,20}$/.test(yt)) {
    const start = u.searchParams.get("t")?.replace(/[^0-9]/g, "");
    return {
      kind: "youtube",
      embedUrl: `https://www.youtube-nocookie.com/embed/${yt}${start ? `?start=${start}` : ""}`,
      thumbnailUrl: `https://i.ytimg.com/vi/${yt}/mqdefault.jpg`,
      host,
    };
  }

  if (host.endsWith("vimeo.com")) {
    const id = u.pathname.split("/").filter(Boolean)[0];
    if (id && /^\d+$/.test(id)) {
      return {
        kind: "vimeo",
        embedUrl: `https://player.vimeo.com/video/${id}`,
        thumbnailUrl: null,
        host,
      };
    }
  }

  if (host.endsWith("instagram.com")) {
    return { kind: "instagram", embedUrl: null, thumbnailUrl: null, host };
  }

  return { kind: "other", embedUrl: null, thumbnailUrl: null, host };
}

export function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (!u.hostname.includes(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}
