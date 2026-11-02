#!/usr/bin/env python3
"""
Resume PDF — generated ONLY from blueprint FACTS (section 4): person, career
path, skills, top-3 projects. No invented content. Replace with the owner's
real resume at public/Eirele_Joven_Boter_Resume.pdf when available (TODO.md).
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable,
)

FG = HexColor("#111111")
MUTED = HexColor("#5a5a5a")
ACCENT = HexColor("#FFB454")
INK = HexColor("#1a1203")
LINE = HexColor("#d9d5cc")

body = ParagraphStyle("body", fontName="Helvetica", fontSize=9.5, leading=13.5, textColor=FG)
small = ParagraphStyle("small", parent=body, fontSize=8.5, textColor=MUTED)
name_style = ParagraphStyle("name", fontName="Helvetica-Bold", fontSize=26, leading=30, textColor=FG)
role_style = ParagraphStyle("role", fontName="Helvetica", fontSize=10.5, leading=14, textColor=MUTED)
h = ParagraphStyle("h", fontName="Helvetica-Bold", fontSize=9, leading=12, textColor=FG, spaceBefore=4)
item = ParagraphStyle("item", parent=body, fontSize=9.5, leading=13)

doc = SimpleDocTemplate(
    "/home/z/my-project/public/Eirele_Joven_Boter_Resume.pdf",
    pagesize=A4,
    leftMargin=18 * mm, rightMargin=18 * mm, topMargin=16 * mm, bottomMargin=16 * mm,
    title="Eirele Joven Boter — Software Engineer",
    author="Eirele Joven Boter",
)

story = []

story.append(Paragraph("EIRELE JOVEN BOTER", name_style))
story.append(Paragraph(
    "Software Engineer — Web Development · IoT Smart-Device Development · AI Engineering",
    role_style))
story.append(Paragraph(
    "Mandaluyong, Philippines · eirelejovenboter2@gmail.com · "
    'linkedin.com/in/eirele-joven-boter · github.com/eirele01', small))
story.append(Spacer(1, 4))
story.append(HRFlowable(width="100%", thickness=2, color=ACCENT))
story.append(Spacer(1, 8))

story.append(Paragraph("PROFILE", h))
story.append(HRFlowable(width="100%", thickness=0.5, color=LINE))
story.append(Spacer(1, 4))
story.append(Paragraph(
    "I develop enterprise systems end to end: web, IoT and AI, from the first "
    "conversation to the live deployment. Operations manager and seafarer turned "
    "engineer — different decks, same job: keep complex systems running under pressure.",
    body))
story.append(Spacer(1, 10))

story.append(Paragraph("EXPERIENCE", h))
story.append(HRFlowable(width="100%", thickness=0.5, color=LINE))
story.append(Spacer(1, 4))
exp = [
    ("2019 – present", "<b>Software Engineer</b> — Freelance full-stack from 2019; "
     "IoT and enterprise systems at Tensei Philippines Inc. from 2024."),
    ("2016 – 2019", "<b>Seafarer, Able Seaman</b> — Kept complex systems running "
     "under pressure, far from help."),
    ("2014 – 2016", "<b>Operations Manager</b> — Ran day-to-day operations and "
     "learned how businesses actually break."),
]
for period, text in exp:
    row = [[Paragraph(f"<font name='Helvetica' size='8.5' color='#5a5a5a'>{period}</font>", item),
            Paragraph(text, item)]]
    t = Table(row, colWidths=[32 * mm, 122 * mm])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    story.append(t)
story.append(Spacer(1, 10))

story.append(Paragraph("SELECTED PROJECTS", h))
story.append(HRFlowable(width="100%", thickness=0.5, color=LINE))
story.append(Spacer(1, 4))
projects = [
    ("Reservation PH — reservationph.com",
     "Multi-tenant SaaS booking platform for service businesses: real-time scheduling, "
     "PayMongo payments (GCash, Maya), loyalty programs, automated email notifications, "
     "analytics dashboards. <i>Laravel 12, Next.js, Inertia, Tailwind CSS, ShadCN, GCP.</i>"),
    ("Duff Street Clinic — duffstreetcomplex.com.au",
     "High-traffic, mobile-responsive site for an Australian medical centre with 50+ "
     "doctors: online booking, telehealth access, dynamic service directories. "
     "<i>WordPress, Elementor.</i>"),
    ("BrilliantPOS — brilliantpos.com",
     "Multi-tenant SaaS point-of-sale with cloud inventory replenishment and workforce "
     "management, used by 250 retail and service businesses. "
     "<i>Laravel 7, Tailwind CSS, MySQL, cPanel.</i>"),
]
for title, text in projects:
    story.append(Paragraph(f"<b>{title}</b>", item))
    story.append(Paragraph(text, item))
    story.append(Spacer(1, 5))
story.append(Spacer(1, 5))

story.append(Paragraph("SKILLS", h))
story.append(HRFlowable(width="100%", thickness=0.5, color=LINE))
story.append(Spacer(1, 4))
skills = [
    ("Frontend", "Vue, Nuxt, React, Next.js, Inertia, Tailwind CSS, TypeScript"),
    ("Backend", "PHP, Laravel, REST APIs, WebSockets, MySQL, Firebase, Firestore, Supabase"),
    ("IoT", "MQTT, Java (Android), Flutter, SwitchBot, LoRaWAN"),
    ("Cloud", "GCP (App Engine, Compute Engine, Cloud Run, Cloud Tasks), Docker"),
]
for label, items in skills:
    row = [[Paragraph(f"<font name='Helvetica-Bold' size='9'>{label}</font>", item),
            Paragraph(items, item)]]
    t = Table(row, colWidths=[24 * mm, 130 * mm])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))
    story.append(t)

doc.build(story)
print("resume PDF written")
