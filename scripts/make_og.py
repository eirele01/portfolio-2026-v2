#!/usr/bin/env python3
"""Generate og-image.jpg (1200x630): hero cut-out on #f4f2ee with name and role.

Blueprint section 17. Falls back to the EJB monogram plate when the keyed
cut-out (public/media/hero/eirele-cutout.webp) has not been produced yet.
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
BG = (244, 242, 238)  # --bg light
FG = (17, 17, 17)  # --fg
ACCENT = (255, 180, 84)  # #FFB454

CUTOUT = Path("/home/z/my-project/public/media/hero/eirele-cutout.webp")
OUT = Path("/home/z/my-project/public/og-image.jpg")


def font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except OSError:
        return ImageFont.load_default()


img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)

SANS = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
SANS_B = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"

# Accent bar + label + name + positioning line
d.rectangle([96, 214, 96 + 64, 220], fill=ACCENT)
d.text((96, 246), "SOFTWARE ENGINEER — WEB · IOT · AI", font=font(MONO, 22), fill=(90, 88, 84))
d.text((92, 288), "EIRELE JOVEN", font=font(SANS_B, 84), fill=FG)
d.text((92, 380), "BOTER", font=font(SANS_B, 84), fill=FG)
d.text((96, 496), "I develop enterprise systems end to end.", font=font(SANS, 28), fill=(60, 58, 54))

if CUTOUT.exists():
    # Real keyed portrait, bottom-anchored on the right
    cut = Image.open(CUTOUT).convert("RGBA")
    target_h = 560
    scale = target_h / cut.height
    cut = cut.resize((int(cut.width * scale), target_h), Image.LANCZOS)
    x = W - cut.width - 56
    y = H - target_h - 8
    img.paste(cut, (x, y), cut)
    print("og-image: real portrait")
else:
    # Monogram plate fallback
    cx, cy, r = 940, 300, 150
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(17, 17, 17, 40), width=2)
    d.ellipse([cx - r + 18, cy - r + 18, cx + r - 18, cy + r - 18], outline=(17, 17, 17, 60), width=1)
    mono = font(MONO, 64)
    tb = d.textbbox((0, 0), "EJB", font=mono)
    d.text((cx - (tb[2] - tb[0]) / 2, cy - (tb[3] - tb[1]) / 2 - 8), "EJB", font=mono, fill=(17, 17, 17, 210))
    d.ellipse([cx + 84, cy + 84, cx + 108, cy + 108], fill=ACCENT)
    print("og-image: monogram fallback")

img.save(OUT, quality=88)
print(f"og-image.jpg written ({OUT.stat().st_size // 1024} KB)")
