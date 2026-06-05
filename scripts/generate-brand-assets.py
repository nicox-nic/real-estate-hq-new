"""One-off brand PNGs for favicon, apple touch, and Open Graph. Run: python scripts/generate-brand-assets.py"""
import shutil
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    raise SystemExit("Install Pillow: pip install Pillow")

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "app"
PUBLIC = ROOT / "public"

CANVAS = "#FBF8F3"
INK = "#2B2A28"
GOLD = "#A88B4A"
MUTED = "#6B6864"
BORDER = "#E8D9B8"


def font(size: int, bold: bool = False):
    candidates = [
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
        if bold
        else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for path in candidates:
        p = Path(path)
        if p.exists():
            return ImageFont.truetype(str(p), size)
    return ImageFont.load_default()


def icon_32() -> Image.Image:
    img = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((0, 0, 31, 31), radius=8, fill=GOLD)
    f = font(11, True)
    d.text((5, 8), "HQ", fill=CANVAS, font=f)
    return img


def apple_180() -> Image.Image:
    img = Image.new("RGBA", (180, 180), CANVAS)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((4, 4, 175, 175), radius=36, outline=BORDER, width=4)
    d.text((18, 52), "Real Estate", fill=INK, font=font(18, True))
    d.text((52, 88), "HQ", fill=GOLD, font=font(36, True))
    return img


def og_1200x630() -> Image.Image:
    img = Image.new("RGB", (1200, 630), CANVAS)
    d = ImageDraw.Draw(img)
    for y in range(630):
        t = y / 630
        r = int(0xFB + (0xE8 - 0xFB) * t * 0.4)
        g = int(0xF8 + (0xD9 - 0xF8) * t * 0.4)
        b = int(0xF3 + (0xB8 - 0xF3) * t * 0.4)
        d.line([(0, y), (1200, y)], fill=(r, g, b))
    d.rounded_rectangle((72, 64, 144, 136), radius=18, fill=GOLD)
    d.text((88, 88), "HQ", fill=CANVAS, font=font(28, True))
    d.text((168, 72), "Real Estate ", fill=INK, font=font(44, True))
    w = d.textlength("Real Estate ", font=font(44, True))
    d.text((168 + w, 72), "HQ", fill=GOLD, font=font(44, True))
    d.text((168, 132), "Your AI-powered real estate sales OS.", fill=MUTED, font=font(22))
    body = (
        "Leads · Listings · Deals · Commissions — built for agents, brokers, "
        "and realtors in the Philippine market."
    )
    d.text((72, 360), body, fill=MUTED, font=font(20))
    d.text((72, 560), "rehq.appssandbox.com", fill="#9A968F", font=font(18))
    d.text((900, 560), "Prototype · Mock data", fill="#9A968F", font=font(18))
    return img


def main():
    APP.mkdir(parents=True, exist_ok=True)
    PUBLIC.mkdir(parents=True, exist_ok=True)
    icon_32().save(APP / "icon.png")
    apple_180().save(APP / "apple-icon.png")
    og = og_1200x630()
    og.save(APP / "opengraph-image.png")
    og.save(PUBLIC / "og-image.png")
    for name in ("icon.png", "apple-icon.png"):
        shutil.copy2(APP / name, PUBLIC / name)
    print(
        "Wrote app/icon.png, app/apple-icon.png, app/opengraph-image.png, "
        "public/icon.png, public/apple-icon.png, public/og-image.png"
    )


if __name__ == "__main__":
    main()
