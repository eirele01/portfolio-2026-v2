import { z } from "zod";

/**
 * The Work shelf [WORK-01] — products launched from zero, shown in the
 * "SHIPPED" section between story phase 7 and Contact. Content provided by
 * the owner (2026-11-01); descriptions are tightened from the owner's key
 * features, never invented. Stack lists mirror the owner's words.
 *
 * `image` points at public/media/work/<id>.jpg — real screenshots captured
 * from the live sites where the sandbox could reach them (see
 * scripts/media/work-images.mjs); the rest are designed placeholders the
 * owner can swap with a real capture at the same path.
 */
const WorkItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().url(),
  /** Short category label on the card (mono, uppercase). */
  tag: z.string(),
  /** 1–2 sentence key description (owner's features, tightened). */
  description: z.string(),
  stack: z.array(z.string()),
  image: z.string(),
  /** Shown only when the project has one on the site (blueprint rule). */
  metric: z
    .object({ value: z.number(), suffix: z.string(), label: z.string() })
    .optional(),
});

export type WorkItem = z.infer<typeof WorkItemSchema>;

export const work: WorkItem[] = [
  {
    id: "reservation-ph",
    name: "Reservation PH",
    url: "https://www.reservationph.com/",
    tag: "Booking SaaS",
    description:
      "Guest booking with no app or account needed — real-time smart scheduling, manual QR payment setups and premium PayMongo integrations for GCash and Maya.",
    stack: ["Nuxt JS", "Inertia JS", "Laravel", "MySQL", "Tailwind CSS", "ShadCN", "PayMongo", "Docker", "GCP"],
    image: "/media/work/reservation-ph.jpg",
  },
  {
    id: "brilliantpos",
    name: "Brilliant POS",
    url: "https://brilliantpos.com/",
    tag: "Retail & Restaurant POS",
    description:
      "Point-of-sale software and hardware for brick-and-mortar industries — retail, bars, restaurants, liquor stores and salons.",
    stack: ["Laravel 8", "Tailwind CSS", "MySQL", "Stripe", "Docker", "GCP"],
    image: "/media/work/brilliantpos.jpg",
    metric: { value: 250, suffix: "+", label: "businesses" },
  },
  {
    id: "duff-street",
    name: "Duff Street Medical Complex",
    url: "https://duffstreetcomplex.com.au/",
    tag: "Clinic Website · AU",
    description:
      "The digital front door for an all-in-one family medical clinic in Cranbourne West, Victoria, Australia.",
    stack: ["WordPress", "Elementor Pro"],
    image: "/media/work/duff-street.jpg",
  },
  {
    id: "tensei",
    name: "Tensei Philippines Inc.",
    url: "https://tenseiph.com/",
    tag: "Enterprise · iBMS",
    description:
      "Custom backend structures, intelligent building management systems (iBMS), RPA and computerized maintenance — upgrading legacy operational infrastructure.",
    stack: ["Vue JS", "Inertia JS", "Laravel", "MySQL", "Tailwind CSS", "ShadCN", "Java", "PayMongo", "Docker", "GCP", "LoRaWAN"],
    image: "/media/work/tensei.jpg",
  },
  {
    id: "baganivpn",
    name: "BaganiVPN",
    url: "https://baganivpn.com/",
    tag: "VPN · Security",
    description:
      "Built on an OpenVPN protocol backbone — data obfuscation, dark-mode UI, real-time connection status metrics and server network tunneling used within local tech circles.",
    stack: ["PHP", "MySQL", "Java", "JavaScript", "VPN protocols", "cPanel", "Google AdSense"],
    image: "/media/work/baganivpn.jpg",
  },
  {
    id: "reyes-gym",
    name: "Reyes Gym Mandaluyong",
    url: "https://reyes-gym.vercel.app/",
    tag: "Community Fitness",
    description:
      "Digital home of a community sports institution operating since 1990 — blending traditional community sports with modernized athletic spaces, notably hosting the first NBA Community Court in the Philippines.",
    stack: ["Next JS", "ShadCN", "Vercel", "Supabase"],
    image: "/media/work/reyes-gym.jpg",
  },
  {
    id: "cozycare",
    name: "CozyCare PH",
    url: "https://cozy-care-ph.vercel.app/",
    tag: "On-demand Services",
    description:
      "Streamlined on-demand residential and commercial deep cleaning across Greater Metro Manila and suburban provinces — Rizal, Cavite, Laguna, Bulacan and Tagaytay.",
    stack: ["Next JS", "ShadCN", "Vercel", "Supabase"],
    image: "/media/work/cozycare.jpg",
  },
  {
    id: "pinoyinternethub",
    name: "PinoyInternetHub",
    url: "https://pinoyinternethub.com/",
    tag: "Network Tooling",
    description:
      "A web-based management backend where users generate custom connection payloads and OpenTunnel/OpenVPN server configs (.ehi / .tnl scripts) for private network tunnels.",
    stack: ["PHP", "MySQL", "Java", "JavaScript", "VPN protocols", "cPanel", "Google AdSense"],
    image: "/media/work/pinoyinternethub.jpg",
  },
  {
    id: "upload2earn",
    name: "Upload2Earn",
    url: "https://www.upload2earn.pw/",
    tag: "File Hosting · PPD",
    description:
      "A cloud-based pay-per-download hosting platform — upload digital files, share the generated links and monetize the resulting traffic.",
    stack: ["Laravel 8", "Tailwind CSS", "MySQL", "Stripe", "Docker", "GCP", "Google AdSense"],
    image: "/media/work/upload2earn.jpg",
  },
];

WorkItemSchema.array().parse(work);
