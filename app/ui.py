from PIL import Image, ImageDraw, ImageFont


def font(size):
    try:
        return ImageFont.truetype("DejaVuSans.ttf", size)
    except OSError:
        return ImageFont.load_default(size=size)


def sad_face_frame(size):
    """A quiet visual request to slow down, readable without text."""
    width, height = size
    frame = Image.new("RGB", size, "#fffdf5")
    draw = ImageDraw.Draw(frame)
    cx, cy = width // 2, height // 2
    radius = min(width, height) * 3 // 8
    ink = "#304b5f"
    draw.ellipse((cx - radius, cy - radius, cx + radius, cy + radius),
                 fill="#f5d878", outline=ink, width=4)
    eye = max(3, radius // 15)
    for x in (cx - radius // 3, cx + radius // 3):
        draw.ellipse((x - eye, cy - radius // 4 - eye, x + eye, cy - radius // 4 + eye), fill=ink)
    draw.arc((cx - radius // 2, cy + radius // 5, cx + radius // 2, cy + radius),
             200, 340, fill=ink, width=5)
    return frame


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


def player_frame(gallery, audio, recording, last_action="Ready"):
    """Photo and player controls for both 240x320 and 320x240 displays."""
    from PIL import ImageOps
    with Image.open(gallery.paths[gallery.index]) as source:
        size = source.size
        photo = source.convert("RGB")
    width, height = size
    panel_y = height - 126
    frame = Image.new("RGB", size, "#101f2c")
    draw = ImageDraw.Draw(frame)
    draw.text((10, 8), "ALFA", font=font(13), fill="#63c6ad")
    counter = f"PHOTO {gallery.index + 1}/{len(gallery.paths)}"
    draw.text((width - 10 - draw.textlength(counter, font=font(11)), 9), counter, font=font(11), fill="#d2dee7")
    fitted = ImageOps.contain(photo, (width - 16, panel_y - 39), Image.Resampling.LANCZOS)
    frame.paste(fitted, ((width - fitted.width) // 2, 31 + (panel_y - 39 - fitted.height) // 2))
    draw.rounded_rectangle((6, panel_y, width - 7, height - 4), radius=8, fill="#192e3d")
    name = recording[4:] if len(recording) > 4 and recording[:3].isdigit() and recording[3] == "-" else recording
    title_font = font(11)
    while name and draw.textlength(name, font=title_font) > width - 24:
        name = name[:-4] + "..." if not name.endswith("...") else name[:-4] + "..."
    draw.text((12, panel_y + 9), name, font=title_font, fill="white")
    playing, elapsed, duration = audio.playing, audio.position, audio.duration
    progress = min(1, elapsed / duration) if duration else 0
    draw.rectangle((12, panel_y + 28, width - 13, panel_y + 32), fill="#304b5f")
    if progress:
        draw.rectangle((12, panel_y + 28, 12 + int((width - 25) * progress), panel_y + 32), fill="#63c6ad")
    status = "Playing" if playing else "Finished" if duration and elapsed >= duration else "Stopped"
    if recording == "Audio disabled":
        status = recording
    draw.text((12, panel_y + 38), status, font=font(11), fill="#63c6ad" if playing else "#c3d3df")
    def timestamp(seconds):
        minutes, seconds = divmod(max(0, int(seconds)), 60)
        return f"{minutes:02d}:{seconds:02d}"
    timing = f"{timestamp(elapsed)} / {timestamp(duration)}"
    draw.text((width - 12 - draw.textlength(timing, font=font(10)), panel_y + 39), timing, font=font(10), fill="#c3d3df")
    draw.text((12, panel_y + 58), f"VOL {audio.volume:.0%}", font=font(11), fill="white")
    draw.rectangle((89, panel_y + 62, width - 13, panel_y + 68), fill="#304b5f")
    if audio.volume:
        draw.rectangle((89, panel_y + 62, 89 + int((width - 102) * audio.volume), panel_y + 68), fill="#e4bd45")
    labels = ("< PHOTO", "STOP" if playing else "PLAY", "PHOTO >")
    cell = (width - 24) / 3
    for index, label in enumerate(labels):
        left, right = int(10 + index * cell), int(10 + (index + 1) * cell - 4)
        draw.rounded_rectangle((left, panel_y + 78, right, panel_y + 102), radius=4,
                               fill="#63c6ad" if index == 1 else "#304b5f")
        draw.text((left + (right - left - draw.textlength(label, font=font(10))) / 2, panel_y + 85), label,
                  font=font(10), fill="#101f2c" if index == 1 else "white")
    hint = "UP/DOWN: volume | hold CENTER: quit"
    draw.text((12, height - 17), hint, font=font(9), fill="#c3d3df")
    return frame
