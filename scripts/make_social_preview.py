"""Draw an original 1200 x 630 repository preview. No character media."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]


def font(size):
    for name in ("/System/Library/Fonts/Supplemental/Arial.ttf", "DejaVuSans.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default(size=size)


if __name__ == "__main__":
    image = Image.new("RGB", (1200, 630), "#20392e")
    draw = ImageDraw.Draw(image)
    draw.text((70, 62), "M / RADIO LAB", font=font(20), fill="#c7ed78")
    draw.text((70, 177), "Moomin Radio", font=font(70), fill="#f3f0e7")
    draw.text((74, 288), "A small radio. A world to explore.", font=font(27), fill="#dce3c9")
    draw.text((74, 475), "RASPBERRY PI  /  PYTHON  /  MIT CODE", font=font(17), fill="#c7ed78")
    draw.rounded_rectangle((820, 110, 1100, 500), radius=28, fill="#d4ae78")
    draw.rounded_rectangle((857, 145, 1063, 357), radius=12, fill="#152a20")
    draw.rectangle((870, 160, 1050, 344), fill="#e9eed5")
    draw.text((925, 194), "A", font=font(110), fill="#20392e")
    for x, y in ((960, 392), (926, 427), (994, 427), (960, 462)):
        draw.ellipse((x-13, y-13, x+13, y+13), fill="#f3f0e7")
    draw.ellipse((947, 414, 973, 440), fill="#c7ed78")
    image.save(ROOT / ".github/social-preview.png")
