"use client";

import { useEffect, useRef, useState } from "react";
import { mediaUrl, MEDIA } from "@/lib/media/media";
import { person } from "@/content/facts";

/**
 * PortraitSlot — reserves the hero's right column so hydration causes no
 * shift. When the green-screen cut-out exists at /media/hero/eirele-cutout.webp
 * it is shown bottom-aligned with a soft contact shadow; until then a
 * designed EJB monogram medallion takes the slot (never a fake photo —
 * FACTS only). Breathing/idle motion is handled by the Hero timeline.
 */
export function PortraitSlot() {
  const [hasCutout, setHasCutout] = useState(false);
  const checked = useRef(false);

  useEffect(() => {
    if (checked.current) return;
    checked.current = true;
    const img = new Image();
    img.onload = () => setHasCutout(true);
    img.onerror = () => setHasCutout(false);
    img.src = mediaUrl(MEDIA.heroCutout);
  }, []);

  return (
    <div className="relative flex h-[46svh] w-auto items-end justify-center sm:h-[56svh] lg:h-[82svh]">
      {/* soft elliptical contact shadow under the shoes / medallion */}
      <div
        aria-hidden="true"
        className="absolute bottom-[2%] left-1/2 h-6 w-[62%] -translate-x-1/2 rounded-[100%] bg-black/25 blur-md"
      />
      <div data-breathing className="relative flex h-full items-end justify-center">
        {hasCutout ? (
          <img
            src={mediaUrl(MEDIA.heroCutout)}
            alt=""
            aria-hidden="true"
            className="h-full w-auto object-contain object-bottom"
            fetchPriority="high"
          />
        ) : (
          <div
            aria-hidden="true"
            className="relative flex h-[min(64vw,300px)] w-[min(64vw,300px)] items-center justify-center rounded-full border border-line bg-[#ece9e2] lg:h-[min(30vw,340px)] lg:w-[min(30vw,340px)]"
          >
            <span className="label-mono absolute inset-0 flex items-center justify-center !text-[clamp(2.4rem,6vw,4.5rem)] !tracking-[0.06em] text-ink/85">
              {person.monogram}
            </span>
            <span className="absolute bottom-[14%] right-[16%] h-2.5 w-2.5 rounded-full bg-amber" />
            <span
              className="absolute inset-[6%] rounded-full border border-dashed border-line/70"
              style={{ transform: "rotate(8deg)" }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
