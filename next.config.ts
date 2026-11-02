import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  /**
   * Media caching [CACHE-01]. Static media used to ship `max-age=0`, so
   * every visit revalidated 33 files (33 round trips) and any cache
   * eviction re-downloaded ~56 MB of video over the preview gateway —
   * the "loading is slow" report. Media files are content-stable between
   * re-encodes and are fetched with `cache: "force-cache"` by the
   * preloader, so a 24h fresh window + SWR keeps same-day repeat visits
   * and refreshes effectively offline. Deliberately NOT `immutable` with
   * a huge max-age: re-encodes reuse the same filenames (v1→v3 did), and
   * a year-long immutable window would serve stale footage to returning
   * visitors. If media ever changes under the same names, either wait out
   * the window, hard-refresh, or bump the filename in media.ts.
   */
  async headers() {
    return [
      {
        source: "/media/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
