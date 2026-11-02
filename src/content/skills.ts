import { z } from "zod";

/**
 * THE STACK [STACK-01] — the full toolkit, shown in the "PHASE 09 / STACK"
 * section between the Work shelf and Contact (owner request, 2026-11-01).
 * Content provided verbatim by the owner; the only edits are brand-casing
 * normalisations (LoraWAN → LoRaWAN, Paymongo → PayMongo, Deepseek →
 * DeepSeek, Digital Ocean → DigitalOcean, N8N → n8n, RestAPIs → REST APIs,
 * A2hosting → A2 Hosting, Virtual Private Server/Network → VPS/VPN) so the
 * chips read like the products' own names. Nothing added, nothing removed.
 *
 * This module is the CANONICAL skill list: the section renders it and the
 * chatbot's system prompt compiles it (knowledge.ts). The coarser
 * `skillGroups` in facts.ts stays as the Quick View summary.
 */
const SkillCategorySchema = z.object({
  /** Stable key (also the row's React key). */
  id: z.string(),
  /** Display name of the discipline. */
  label: z.string(),
  /** 3–5 word mono descriptor under the label (presentational). */
  blurb: z.string(),
  skills: z.array(z.string()).min(1),
});

export type SkillCategory = z.infer<typeof SkillCategorySchema>;

export const skills: SkillCategory[] = [
  {
    id: "frontend",
    label: "Frontend",
    blurb: "Interfaces, motion & tooling",
    skills: [
      "JavaScript",
      "TypeScript",
      "React",
      "Next.js",
      "Three.js",
      "Vue.js",
      "Nuxt.js",
      "Tailwind CSS",
      "Styled Components",
      "Vite",
      "Webpack",
      "ESLint",
      "Prettier",
      "Figma",
    ],
  },
  {
    id: "backend",
    label: "Backend",
    blurb: "APIs, data & auth",
    skills: [
      "PHP",
      "Laravel",
      "REST APIs",
      "WebSocket",
      "MySQL",
      "Firebase",
      "PostgreSQL",
      "Supabase",
      "Neon",
      "MongoDB",
      "Postman",
      "OAuth",
      "JWT",
      "PayMongo",
    ],
  },
  {
    id: "mobile",
    label: "Mobile",
    blurb: "Android & cross-platform",
    skills: ["Java", "Flutter", "Dart"],
  },
  {
    id: "iot",
    label: "IoT & Hardware",
    blurb: "Devices, sensors & radios",
    skills: ["LoRaWAN", "SwitchBot", "Zenner", "Acrel", "MQTT", "HTTP APIs"],
  },
  {
    id: "devops",
    label: "DevOps & Cloud",
    blurb: "Deploys, CI & infrastructure",
    skills: [
      "GCP",
      "App Engine",
      "Compute Engine",
      "Cloud Run",
      "Cloud Storage",
      "AWS",
      "Azure",
      "Vercel",
      "GitHub Actions",
      "GitLab CI",
      "Docker",
      "Kubernetes",
      "cPanel",
      "A2 Hosting",
      "Hosting",
      "Hostinger",
      "DigitalOcean",
      "Vultr",
      "VPS",
      "VPN",
    ],
  },
  {
    id: "ai",
    label: "AI",
    blurb: "LLMs, agents & local models",
    skills: [
      "OpenAI",
      "Anthropic",
      "Qwen",
      "DeepSeek",
      "Codex",
      "GLM",
      "Hugging Face",
      "Ollama",
      "Strata Engine",
    ],
  },
  {
    id: "cms",
    label: "CMS & No-Code",
    blurb: "Sites & automations",
    skills: ["WordPress", "Elementor", "Figma", "n8n"],
  },
  {
    id: "tools",
    label: "Developer Tools",
    blurb: "The daily drivers",
    skills: ["Git", "GitHub", "GitLab", "VS Code"],
  },
];

/** Total number of individual tools across all disciplines (74 as provided). */
export const skillTotal = skills.reduce((sum, c) => sum + c.skills.length, 0);

SkillCategorySchema.array().parse(skills);
