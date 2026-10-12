from PIL import Image, ImageDraw, ImageFont


def font(size):
    try:
        return ImageFont.truetype("DejaVuSans.ttf", size)
    except OSError:
        return ImageFont.load_default(size=size)


def screen_patterns(size):
    width, height = size
    for color in ("red", "green", "blue", "white", "black"):
        frame = Image.new("RGB", size, color)
        draw = ImageDraw.Draw(frame)
        draw.rectangle((0, 0, width - 1, 30), fill="black" if color != "black" else "white")
        draw.text((8, 7), color.upper(), font=font(14), fill="white" if color != "black" else "black")
        yield color, frame
    frame = Image.new("RGB", size, "white")
    draw = ImageDraw.Draw(frame)
    draw.rectangle((0, 0, width - 1, height - 1), outline="black", width=3)
    colors = ("red", "green", "blue", "yellow", "cyan", "magenta")
    for index, color in enumerate(colors):
        y = 44 + index * (height - 96) // len(colors)
        draw.rectangle((10, y, width - 11, y + (height - 96) // len(colors) - 2), fill=color)
    draw.text((10, 12), "TOP / RGB / BORDER", font=font(13), fill="black")
    draw.text((10, height - 33), "BOTTOM - 240 x 320", font=font(12), fill="black")
    yield "orientation", frame


class Gallery:
    def __init__(self, paths):
        if not paths:
            raise ValueError("The gallery needs at least one image.")
        self.paths = paths
        self.index = 0

    def navigate(self, button):
        if button == "left":
            self.index = (self.index - 1) % len(self.paths)
        elif button == "right":
            self.index = (self.index + 1) % len(self.paths)
        elif button == "up":
            self.index = 0
        elif button == "down":
            self.index = len(self.paths) - 1

    def frame(self, status="Ready"):
        with Image.open(self.paths[self.index]) as image:
            frame = image.convert("RGB")
        width, height = frame.size
        draw = ImageDraw.Draw(frame)
        draw.rectangle((0, 0, width, 24), fill="#172b43")
        draw.text((7, 4), f"{self.index + 1}/{len(self.paths)}   {status}", font=font(12), fill="white")
        draw.rectangle((0, height - 30, width, height), fill="#172b43")
        draw.text((7, height - 26), "LEFT / RIGHT: photo", font=font(11), fill="white")
        draw.text((7, height - 13), "CENTER: sound | hold: quit", font=font(10), fill="white")
        return frame


def speaker_status_frame(size, status, lines=(), progress=None, error=False):
    """Readable playback status; progress is elapsed time, not an acoustic measurement."""
    width, height = size
    frame = Image.new("RGB", size, "#101f2c")
    draw = ImageDraw.Draw(frame)
    accent = "#ef6b69" if error else "#63c6ad"
    draw.rectangle((0, 0, width, 42), fill=accent)
    draw.text((12, 12), "SPEAKER TEST", font=font(18), fill="#101f2c")
    draw.text((12, 56), status, font=font(18), fill="white")
    y = 88
    body = font(12)
    for line in lines:
        chunk = ""
        for character in str(line):
            if chunk and draw.textlength(chunk + character, font=body) > width - 24:
                draw.text((12, y), chunk, font=body, fill="#d2dee7")
                y += 17
                chunk = ""
            chunk += character
            if y > height - 57:
                break
        if y > height - 57:
            break
        draw.text((12, y), chunk, font=body, fill="#d2dee7")
        y += 21
    if progress is not None:
        fraction = max(0, min(1, progress))
        draw.rectangle((12, height - 42, width - 13, height - 31), fill="#304758")
        draw.rectangle((12, height - 42, 12 + int((width - 25) * fraction), height - 31), fill=accent)
    draw.text((12, height - 23), "Details in SSH / Ctrl+C stops", font=font(10), fill="#91aabb")
    return frame
