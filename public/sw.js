/**
 * Media cache Service Worker [CACHE-02] — Eirele Joven Boter portfolio.
 *
 * WHY: on the preview gateway, video bytes cross a slow proxy pipe and the
 * browser HTTP cache is only as reliable as the gateway's headers and the
 * origin's eviction behaviour. A SW-owned Cache API layer is under OUR
 * control: once a media file is here, repeat visits and refreshes are
 * served from disk with zero network — regardless of what the gateway does.
 *
 * SCOPE (deliberately narrow): same-origin GET requests under /media/ ONLY.
 * Everything else (HTML, JS chunks, fonts, API) passes through untouched,
 * so hot reload, deployments and auth flows can never go stale through us.
 *
 * POLICY:
 *   - Range requests pass through untouched. Two reasons: (1) the 1-byte
 *     availability probe (probeMedia) must not trigger a full multi-MB
 *     download just to answer "does this exist"; (2) the streaming fallback
 *     for a clip whose blob has not landed yet expects native range
 *     behaviour. The preloader's full GETs are what populate this cache.
 *   - Responses ≤ 2 MB (posters, hero cutout) are served
 *     stale-while-revalidate: instant from cache, refreshed in the
 *     background, so a re-encoded poster self-heals on the next visit.
 *   - Larger responses (the mp4 clips) are strict cache-first: a re-encode
 *     under the same filename does NOT self-heal — bump CACHE below
 *     (e.g. media-v2 → media-v3) or postMessage "purge-media-cache" to the
 *     SW after re-encoding (see scripts/media/encode.mjs header note).
 *
 * Version history: media-v1 = 2026-10-31, initial release with the v3
 * short-GOP encodes. media-v2 = 2026-11-01, v4 clarity encodes (1920×1080
 * full / 960×540 light) — same filenames, different bytes, so the version
 * bump is what forces returning visitors to refetch.
 */
const CACHE = "media-v2";
/** Responses at or below this size refresh in the background (SWR). */
const SWR_MAX_BYTES = 2 * 1024 * 1024;

self.addEventListener("install", () => {
  // Take over as soon as possible; there is no "waiting" version to keep —
  // the cache is content-addressed by URL and self-healing for small files.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.filter((n) => n.startsWith("media-") && n !== CACHE).map((n) => caches.delete(n)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "purge-media-cache") {
    event.waitUntil(
      (async () => {
        await caches.delete(CACHE);
        const cs = await self.clients.matchAll();
        cs.forEach((c) => c.navigate?.(c.url).catch(() => {}));
      })(),
    );
  }
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith("/media/")) return;
  // Availability probes and the streaming fallback need native range replies.
  if (req.headers.has("range")) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req, { ignoreVary: true });
      if (cached) {
        // SWR for small files: refresh in the background, serve instantly.
        if (Number(cached.headers.get("Content-Length") ?? Infinity) <= SWR_MAX_BYTES) {
          event.waitUntil(
            fetch(req)
              .then((res) => {
                if (res && res.ok && res.type === "basic") return cache.put(req, res);
              })
              .catch(() => {}),
          );
        }
        return cached;
      }
      try {
        const res = await fetch(req);
        if (res && res.ok && res.type === "basic") {
          // Never await: a failed/oversized put must not break the response.
          cache.put(req, res.clone()).catch(() => {});
        }
        return res;
      } catch {
        return new Response("", { status: 504, statusText: "Offline" });
      }
    })(),
  );
});
