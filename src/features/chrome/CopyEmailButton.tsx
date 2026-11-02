"use client";

import { useRef, useState } from "react";
import { person } from "@/content/facts";
import { track } from "@/lib/analytics";

/** "Copy email" with a polite live-region confirmation. */
export function CopyEmailButton() {
  const [status, setStatus] = useState<"idle" | "copied" | "manual">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = async () => {
    track("contact_click", { channel: "copy-email" });
    try {
      await navigator.clipboard.writeText(person.email);
      setStatus("copied");
    } catch {
      // Clipboard API can be blocked — offer the address for manual copy.
      setStatus("manual");
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus("idle"), 2600);
  };

  return (
    <span className="inline-flex items-center gap-3">
      <button
        type="button"
        onClick={copy}
        className="label-mono inline-flex min-h-[44px] items-center rounded-full border border-line px-4 text-ink transition-colors hover:border-amber"
      >
        {status === "copied" ? "Copied ✓" : status === "manual" ? "Select & copy" : "Copy email"}
      </button>
      <span role="status" className="label-mono text-amber">
        {status === "copied" && "Email copied to clipboard"}
        {status === "manual" && person.email}
      </span>
    </span>
  );
}
