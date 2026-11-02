#!/usr/bin/env python3
"""
Resume PDF — generated from the portfolio's canonical content modules,
resynced 2026-11-02 [RES-01]:

  person/profile ....... src/content/facts.ts      (person, heroBeats)
  experience ........... src/content/experience.ts (CANONICAL logbook —
                         owner-verbatim bullets, all four postings)
  projects ............. src/content/work.ts       (Work shelf [WORK-01] —
                         first four in the owner's shelf order, verbatim
                         descriptions/stacks, metric only where kept)
  skills ............... src/content/skills.ts     (CANONICAL stack ledger —
                         verbatim item names, curated per row for one page:
                         generic tooling (ESLint, Prettier, Postman, VS Code,
                         Webpack, hosting brands) and the AWS/Azure rows are
                         dropped — the blueprint bans AWS claims; the full
                         owner list lives on the site's Stack ledger)

Still a generated FACTS-only resume — replacing it with the owner's real
PDF at public/Eirele_Joven_Boter_Resume.pdf stays open in TODO.md.
AI engineering: listed as a specialty + tool row only (owner's own stack
list); no AI project is claimed anywhere (TODO CONFIRM #6 — no example).

ATS hardening [ATS-01] (2026-11-02): the PDF was already born-digital
text with standard headings and a single column, but real-world ATS
parsers mangle Table flowables (cells dropped/reordered/glued) — the
experience rows and skills rows are now plain paragraphs with indents
(same ledger look, zero Table objects in the file). The invisible
full-width U+3000 spaces inside the job/project title lines are gone
(regular separators), and the PDF Subject/Keywords metadata is filled.
Deliberately kept: no phone (facts.ts phonePublic=false), no EDUCATION
section (no canonical facts — TODO CONFIRM #7), base-14 Helvetica
(the most widely mapped resume font family).
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, HRFlowable,
)

FG = HexColor("#111111")
MUTED = HexColor("#5a5a5a")
ACCENT = HexColor("#FFB454")
INK = HexColor("#1a1203")
LINE = HexColor("#d9d5cc")

body = ParagraphStyle("body", fontName="Helvetica", fontSize=9.5, leading=12, textColor=FG)
small = ParagraphStyle("small", parent=body, fontSize=8.5, textColor=MUTED)
name_style = ParagraphStyle("name", fontName="Helvetica-Bold", fontSize=21, leading=24, textColor=FG)
role_style = ParagraphStyle("role", fontName="Helvetica", fontSize=10, leading=13, textColor=MUTED)
h = ParagraphStyle("h", fontName="Helvetica-Bold", fontSize=9, leading=11, textColor=FG, spaceBefore=3)
item = ParagraphStyle("item", parent=body, fontSize=9.5, leading=12)
bullet = ParagraphStyle("bullet", parent=body, fontSize=9.5, leading=12, leftIndent=8, bulletIndent=0)
sk_item = ParagraphStyle("sk_item", parent=body, fontSize=8.7, leading=11.3)

doc = SimpleDocTemplate(
    "/home/z/my-project/public/Eirele_Joven_Boter_Resume.pdf",
    pagesize=A4,
    leftMargin=17 * mm, rightMargin=17 * mm, topMargin=12 * mm, bottomMargin=12 * mm,
    title="Eirele Joven Boter — Software Engineer",
    author="Eirele Joven Boter",
    subject="Resume — Software Engineer (Web, IoT, AI)",
    keywords=("software engineer, full stack developer, IoT, AI engineering, "
              "TypeScript, Laravel, Next.js, MQTT, Google Cloud Platform, "
              "Eirele Joven Boter"),
)

story = []

story.append(Paragraph("EIRELE JOVEN BOTER", name_style))
story.append(Paragraph(
    "Software Engineer — Web Development · IoT Smart-Device Development · AI Engineering",
    role_style))
story.append(Paragraph(
    "Mandaluyong, Philippines · eirelejovenboter2@gmail.com · "
    'linkedin.com/in/eirele-joven-boter · github.com/eirele01', small))
story.append(Spacer(1, 3))
story.append(HRFlowable(width="100%", thickness=2, color=ACCENT))
story.append(Spacer(1, 6))

story.append(Paragraph("PROFILE", h))
story.append(HRFlowable(width="100%", thickness=0.5, color=LINE))
story.append(Spacer(1, 4))
story.append(Paragraph(
    "I develop enterprise systems end to end: web, IoT and AI — from the first "
    "conversation to the live deployment. Operations manager and seafarer turned "
    "engineer — different decks, same job: keep complex systems running under pressure.",
    body))
story.append(Spacer(1, 6))

story.append(Paragraph("EXPERIENCE", h))
story.append(HRFlowable(width="100%", thickness=0.5, color=LINE))
story.append(Spacer(1, 4))
exp = [
    ("2014 – 2016", "Operations Manager", "Yellow Cab Pizza Co.",
     [
        "Managed shift operations and led a team of 25.",
        "Controlled inventory and labor costs; maintained a 100% customer-satisfaction score.",
     ]),
    ("2016 – 2019", "Able Seaman", "Wallem Philippines Shipping, Inc.",
     [
        "Stood navigation and helm duties on international voyages, working strictly "
        "to global maritime safety and compliance rules.",
     ]),
    ("2019 – Present", "Full Stack Web &amp; Mobile Developer", "Freelance",
     [
        "Plan, build and launch websites, mobile apps and SaaS platforms for clients — "
        "requirements, design, development, deployment and ongoing support, handled end to end.",
        "Delivered booking systems, point-of-sale software and a medical clinic "
        "website used by real businesses and customers.",
     ]),
    ("2024 – Present", "Full Stack Software Engineer / IoT Specialist", "Tensei Philippines Inc.",
     [
        "Full lifecycle of enterprise IoT platforms — building management (iBMS), "
        "CMMS and automation systems — for institutional and hospitality clients.",
        "Design the databases, APIs and device connections (MQTT, WebSockets) that "
        "keep 1,000+ devices online at 99.9% uptime.",
        "Build the real-time web dashboards and the Android app that clients use to "
        "monitor and control their devices, deployed and running on Google Cloud with "
        "automated tests covering device delays and disconnects.",
     ]),
]
# ATS [ATS-01]: no Table flowables — plain paragraphs with indents;
# tables are the classic ATS-parser mangler (cells dropped/reordered).
for period, role, company, bullets in exp:
    story.append(Paragraph(
        f"<b>{role}</b> — {company} · "
        f"<font name='Helvetica' size='8.5' color='#5a5a5a'>{period}</font>",
        item))
    for b in bullets:
        story.append(Paragraph(b, bullet, bulletText="–"))
    story.append(Spacer(1, 2))
story.append(Spacer(1, 4))

story.append(Paragraph("SELECTED PROJECTS", h))
story.append(HRFlowable(width="100%", thickness=0.5, color=LINE))
story.append(Spacer(1, 4))
projects = [
    ("Reservation PH", "reservationph.com", "Booking SaaS",
     "Guest booking with no app or account needed — real-time smart scheduling, "
     "manual QR payment setups and premium PayMongo integrations for GCash and Maya.",
     "Nuxt JS, Inertia JS, Laravel, MySQL, Tailwind CSS, ShadCN, PayMongo, Docker, GCP"),
    ("Brilliant POS", "brilliantpos.com", "Retail &amp; Restaurant POS — 250+ businesses",
     "Point-of-sale software and hardware for brick-and-mortar industries — retail, "
     "bars, restaurants, liquor stores and salons.",
     "Laravel 8, Tailwind CSS, MySQL, Stripe, Docker, GCP"),
    ("Duff Street Medical Complex", "duffstreetcomplex.com.au", "Clinic Website · AU",
     "The digital front door for an all-in-one family medical clinic in Cranbourne "
     "West, Victoria, Australia.",
     "WordPress, Elementor Pro"),
    ("Tensei Philippines Inc.", "tenseiph.com", "Enterprise · iBMS",
     "Custom backend structures, intelligent building management systems (iBMS), RPA "
     "and computerized maintenance — upgrading legacy operational infrastructure.",
     "Vue JS, Inertia JS, Laravel, MySQL, Tailwind CSS, ShadCN, Java, PayMongo, Docker, GCP, LoRaWAN"),
]
for name, url, tag, desc, stack in projects:
    story.append(Paragraph(
        f"<b>{name}</b> — <font color='#5a5a5a'>{url}</font> · "
        f"<font name='Helvetica' size='8.5' color='#5a5a5a'>{tag.upper()}</font>",
        item))
    story.append(Paragraph(desc, item))
    story.append(Paragraph(f"<i>{stack}</i>", small))
    story.append(Spacer(1, 3.5))
story.append(Spacer(1, 2.5))

story.append(Paragraph("SKILLS", h))
story.append(HRFlowable(width="100%", thickness=0.5, color=LINE))
story.append(Spacer(1, 4))
skills = [
    ("Frontend", "JavaScript, TypeScript, React, Next.js, Three.js, Vue.js, Nuxt.js, Tailwind CSS, Vite, Figma"),
    ("Backend", "PHP, Laravel, REST APIs, WebSocket, MySQL, PostgreSQL, MongoDB, Firebase, Supabase, PayMongo"),
    ("Mobile", "Java (Android), Flutter, Dart"),
    ("IoT &amp; Hardware", "MQTT, LoRaWAN, SwitchBot, Zenner, Acrel, HTTP APIs"),
    ("DevOps &amp; Cloud", "GCP (App Engine, Compute Engine, Cloud Run, Cloud Storage), Docker, Kubernetes, Vercel, GitHub Actions, cPanel"),
    ("AI", "OpenAI, Anthropic, Qwen, DeepSeek, GLM, Hugging Face, Ollama"),
    ("CMS &amp; No-Code", "WordPress, Elementor, n8n"),
]
# ATS [ATS-01]: skills as single "Label — items" paragraphs (was a
# two-column Table). One flowing paragraph per category, no cells.
for label, items in skills:
    story.append(Paragraph(
        f"<font name='Helvetica-Bold' size='8.7'>{label}</font> — {items}",
        sk_item))
    story.append(Spacer(1, 1.2))

doc.build(story)
print("resume PDF written")
