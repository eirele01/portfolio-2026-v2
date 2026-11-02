import { z } from "zod";

/**
 * THE LOGBOOK [LOG-01] — the full career history, shown in the
 * "PHASE 10 / LOGBOOK" section between the Stack ledger and Contact
 * (owner request, 2026-11-01). Content provided verbatim by the owner;
 * the only edits are splitting his paragraphs into bullets and the
 * period/tag stamps (presentational). Oldest-first on purpose: the
 * section reads as a voyage — the route unspools from 2014 and ends on
 * the present, which hands off into Contact.
 *
 * This module is the CANONICAL experience record: the section renders it
 * and the chatbot's system prompt compiles it (knowledge.ts). The coarser
 * `career` in facts.ts stays as the Quick View summary — the two agree
 * (2014 ops → 2016 seaman → 2019 freelance → 2024 Tensei).
 */
const PostingSchema = z.object({
  /** Stable key (also the row's React key). */
  id: z.string(),
  /** Display period, verbatim from the owner. */
  period: z.string(),
  /** Start year — drives the rolling year readout in the section header. */
  startYear: z.number(),
  role: z.string(),
  company: z.string(),
  /** Mono stamp on the period line (presentational, one or two words). */
  tag: z.string(),
  /** What the posting involved — faithful to the owner's copy. */
  bullets: z.array(z.string()).min(1),
});

export type Posting = z.infer<typeof PostingSchema>;

export const experience: Posting[] = [
  {
    id: "yellow-cab",
    period: "2014 – 2016",
    startYear: 2014,
    role: "Operations Manager",
    company: "Yellow Cab Pizza Co.",
    tag: "OPERATIONS",
    bullets: [
      "Managed shift operations and led a team of 25.",
      "Controlled inventory and labor costs; ran staff performance evaluations.",
      "Maintained a 100% customer-satisfaction score.",
    ],
  },
  {
    id: "wallem",
    period: "2016 – 2019",
    startYear: 2016,
    role: "Able Seaman",
    company: "Wallem Philippines Shipping, Inc.",
    tag: "MARITIME",
    bullets: [
      "Stood navigation and helm duties on international voyages.",
      "Worked strictly to global maritime safety and compliance rules.",
    ],
  },
  {
    id: "freelance",
    period: "2019 – Present",
    startYear: 2019,
    role: "Full Stack Web & Mobile Developer",
    company: "Freelance",
    tag: "FREELANCE",
    bullets: [
      "Plan, build and launch websites, mobile apps and SaaS platforms for clients.",
      "Delivered booking systems, point-of-sale software and a medical clinic website used by real businesses and customers.",
      "Handle the whole process on my own: requirements, design, development, deployment and ongoing support.",
    ],
  },
  {
    id: "tensei",
    period: "2024 – Present",
    startYear: 2024,
    role: "Full Stack Software Engineer / IoT Specialist",
    company: "Tensei Philippines Inc.",
    tag: "ENTERPRISE IOT",
    bullets: [
      "Full lifecycle of enterprise IoT platforms — building management (iBMS), CMMS and automation systems — for institutional and hospitality clients.",
      "Design the databases, APIs and device connections (MQTT, WebSockets) that keep 1,000+ devices online at 99.9% uptime.",
      "Build the real-time web dashboards and the Android app that clients use to monitor and control their devices.",
      "Deploy and run everything on Google Cloud, with automated tests covering device delays and disconnects.",
    ],
  },
];

/** Full career span in years, from the first posting's start year to now. */
export const experienceYears = new Date().getFullYear() - experience[0].startYear;

PostingSchema.array().parse(experience);
