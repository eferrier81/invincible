import { environment } from "../../environments/environment";

/**
 * API stores relative web paths (e.g. `/images/bosses/x.png`).
 * We always resolve them against the backend base URL so production Angular
 * never tries to load assets from its own origin.
 * Path segments are encoded so filenames with spaces load correctly.
 */
export function imageSrc(path: string | null | undefined): string | null {
  if (path == null || !String(path).trim()) {
    return null;
  }
  const raw = String(path).trim();
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }
  const normalized = raw.startsWith("/") ? raw : `/${raw}`;
  const segments = normalized.split("/").filter((s) => s.length > 0);
  const encodedPath = "/" + segments.map((s) => encodeURIComponent(s)).join("/");
  return `${environment.apiUrl.replace(/\/$/, "")}${encodedPath}`;
}
