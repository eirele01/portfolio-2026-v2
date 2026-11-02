/**
 * FACTS — single source of truth (blueprint section 4).
 * Nothing outside these values may be claimed anywhere in the UI.
 * Items marked CONFIRM are logged in /TODO.md and omitted from copy.
 */

export const person = {
  name: "Eirele Joven Boter",
  monogram: "EJB",
  role: "Software Engineer",
  specialties: ["Web Development", "IoT Smart-Device Development", "AI Engineering"],
  positioning: "I develop enterprise systems end to end.",
  location: "Mandaluyong, Philippines",
  email: "eirelejovenboter2@gmail.com",
  linkedin: "https://www.linkedin.com/in/eirele-joven-boter/",
  github: "https://github.com/eirele01",
  phonePublic: false, // FACTS: phone shown publicly = no
  resumePath: "/Eirele_Joven_Boter_Resume.pdf",
} as const;

export const heroBeats = {
  beat1:
    "I build enterprise systems end to end: web, IoT and AI, from the first conversation to the live deployment.",
  beat2:
    "Operations manager. Seafarer. Engineer. Different decks, same job: keep complex systems running under pressure.",
  beat3: "Scroll to begin. You're the client.",
} as const;

export const career = [
  {
    role: "Operations Manager",
    period: "2014–2016",
    note: "Ran day-to-day operations and learned how businesses actually break.",
  },
  {
    role: "Seafarer, Able Seaman",
    period: "2016–2019",
    note: "Kept complex systems running under pressure, far from help.",
  },
  {
    role: "Software Engineer",
    period: "2019–present",
    note: "Freelance full-stack from 2019; IoT and enterprise systems at Tensei Philippines Inc. from 2024.",
  },
] as const;

export const skillGroups = [
  {
    label: "Frontend",
    items: ["Vue", "Nuxt", "React", "Next.js", "Inertia", "Tailwind CSS", "TypeScript"],
  },
  {
    label: "Backend",
    items: ["PHP", "Laravel", "REST APIs", "WebSockets", "MySQL", "Firebase", "Firestore", "Supabase"],
  },
  {
    label: "IoT",
    items: ["MQTT", "Java (Android)", "Flutter", "SwitchBot", "LoRaWAN"],
  },
  {
    label: "Cloud",
    items: ["GCP", "Docker", "Cloud Run", "Cloud Tasks"],
  },
] as const;

/** Metrics — render only the ones the blueprint marked keep. */
export const metrics = {
  iotConnections: { value: 1000, suffix: "+", label: "concurrent IoT device connections" },
  uptime: { value: 99.9, suffix: "%", label: "uptime" },
  dataPoints: { value: 1000, suffix: "+", label: "data points per minute on GCP" },
  businesses: { value: 250, suffix: "", label: "businesses on BrilliantPOS" },
} as const;

/** Fictional demo client shown in process visuals. Must stay labelled. [CNT-01] */
export const demoClient = {
  name: "Novara",
  note: "Demo client: Novara, a fictional smart-home hub. The process is real; the product is a stand-in.",
} as const;

export const cloudLine = "Google Cloud Platform · Docker · Cloud Run" as const;

export const site = {
  title: "Eirele Joven Boter — Software Engineer (Web, IoT, AI)",
  description:
    "I develop enterprise systems end to end — web, IoT and AI — from the first conversation to the live deployment.",
  /** Set NEXT_PUBLIC_SITE_URL in production; no invented domain. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "",
} as const;
