/**
 * Analytics facade [ANA-01] — cookieless, no personal data, no-ops in dev.
 * All tracking calls in the app go through here; a real provider (Plausible /
 * Umami) can be wired in later without touching components.
 */
export type AnalyticsEvent =
  | "story_start"
  | "phase_reached"
  | "quick_view_open"
  | "quick_view_close"
  | "project_click"
  | "contact_click"
  | "nav_click"
  | "contact_form_sent"
  | "contact_form_error"
  | "resume_download"
  | "mode_resolved"
  | "mode_change"
  | "preload_done"
  | "chat_open"
  | "chat_message"
  | "work_card_click";

type Payload = Record<string, string | number | boolean | undefined>;

const isDev = process.env.NODE_ENV !== "production";

const reported = new Set<string>();

/** Fire once per key per session (e.g. phase_reached per phase). */
export const trackOnce = (key: string, event: AnalyticsEvent, payload?: Payload): void => {
  if (reported.has(key)) return;
  reported.add(key);
  track(event, payload);
};

export function track(event: AnalyticsEvent, payload?: Payload): void {
  if (isDev) {
    // Dev-only visibility, behind a flag to keep the console clean by default.
    if (process.env.NEXT_PUBLIC_DEBUG_ANALYTICS) {
        console.debug("[analytics]", event, payload ?? {});
    }
    return;
  }
  // Production: forward to the configured cookieless provider, if any.
  const w = window as unknown as { plausible?: (e: string, o?: unknown) => void };
  if (typeof w.plausible === "function") {
    w.plausible(event, { props: payload });
  }
}
