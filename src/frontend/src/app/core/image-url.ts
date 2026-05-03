/**
 * API stores relative web paths (e.g. `/images/bosses/x.png`). Same-origin serving:
 * dev proxy and production Nginx forward `/images` to the backend.
 * Path segments are encoded so filenames with spaces (e.g. `atom eve.png`) load correctly.
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
  return "/" + segments.map((s) => encodeURIComponent(s)).join("/");
}
