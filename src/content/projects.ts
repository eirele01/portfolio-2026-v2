import { z } from "zod";
import { metrics } from "./facts";

const ProjectSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string().url(),
  oneLiner: z.string(),
  features: z.array(z.string()),
  stack: z.array(z.string()),
  /** Rendered only when present (blueprint: kept metrics only). */
  metric: z
    .object({ value: z.number(), suffix: z.string(), label: z.string() })
    .optional(),
});

export type Project = z.infer<typeof ProjectSchema>;

export const projects: Project[] = [
  {
    id: "reservation-ph",
    title: "Reservation PH",
    url: "https://www.reservationph.com/",
    oneLiner: "Multi-tenant SaaS booking platform for service businesses.",
    features: [
      "Real-time scheduling",
      "PayMongo payments (GCash & Maya)",
      "Loyalty programs",
      "Automated email notifications",
      "Analytics dashboards",
    ],
    // Owner's list (2026-11-01) — Nuxt, not Next.js as an earlier draft had
    // it; kept in sync with the Work shelf (work.ts).
    stack: ["Nuxt JS", "Inertia JS", "Laravel", "MySQL", "Tailwind CSS", "ShadCN", "PayMongo", "Docker", "GCP"],
  },
  {
    // URL confirmed by the owner 2026-11-01 (duffstreetcomplex.com.au —
    // the ANSWER value; TODO CONFIRM #5 resolved).
    id: "duff-street-clinic",
    title: "Duff Street Clinic",
    url: "https://duffstreetcomplex.com.au/",
    oneLiner:
      "High-traffic, mobile-responsive site for an Australian medical centre with 50+ doctors.",
    features: ["Online booking", "Telehealth access", "Dynamic service directories"],
    stack: ["WordPress", "Elementor Pro"],
  },
  {
    id: "brilliantpos",
    title: "BrilliantPOS",
    url: "https://brilliantpos.com/",
    oneLiner:
      "Multi-tenant SaaS point-of-sale with cloud inventory replenishment and workforce management.",
    features: ["Cloud inventory replenishment", "Workforce management"],
    stack: ["Laravel 8", "Tailwind CSS", "MySQL", "Stripe", "Docker", "GCP"],
    metric: {
      value: metrics.businesses.value,
      suffix: metrics.businesses.suffix,
      label: metrics.businesses.label,
    },
  },
];

ProjectSchema.array().parse(projects);

export const getProject = (id: string): Project => {
  const found = projects.find((p) => p.id === id);
  if (!found) throw new Error(`[content] unknown project id: ${id}`);
  return found;
};
