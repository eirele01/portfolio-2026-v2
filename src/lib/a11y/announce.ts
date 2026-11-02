/** [A11Y-06] Polite announcements for phase changes (debounced 800ms). */

let region: HTMLElement | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let lastMessage = "";

export function registerLiveRegion(el: HTMLElement | null): void {
  region = el;
}

export function announce(message: string): void {
  if (!region) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    // Re-announce identical messages by clearing first.
    if (region) {
      region.textContent = lastMessage === message ? "" : message;
      if (lastMessage === message) {
        requestAnimationFrame(() => {
          if (region) region.textContent = message;
        });
      }
    }
    lastMessage = message;
  }, 800);
}
