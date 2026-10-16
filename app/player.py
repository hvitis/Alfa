from .ui import Gallery, player_frame


class PlayerSession:
    """Actions shared by physical buttons, SSH keys, and hardware-free tests."""
    def __init__(self, images, sounds, audio, fullscreen=False):
        self.gallery = Gallery(images)
        self.sounds = sounds
        self.audio = audio
        self.last_action = "Ready"
        self.fullscreen = fullscreen
        self.animation = None
        self.drawing = None
        self.letter_recordings = None

    def stop_drawing(self):
        if self.drawing and self.drawing.active:
            self.drawing.stop()
            self.audio.stop()

    @property
    def animation_fps(self):
        if self.drawing and self.drawing.active:
            return self.drawing.fps
        return self.animation.fps if self.animation else None

    def action(self, button):
        if button in ("left", "right"):
            self.stop_drawing()
            if self.animation:
                self.animation.stop()
            self.gallery.navigate(button)
            self.last_action = "Previous photo" if button == "left" else "Next photo"
        elif button in ("up", "down"):
            self.stop_drawing()
            if self.animation:
                name = "listening" if button == "up" else "speaking"
                # Mashing the same button lets the running animation finish instead of restarting it.
                if not (self.animation.index() is not None and self.animation.active == name):
                    self.animation.start(name)
                self.last_action = name.capitalize()
                return
            delta = .05 if button == "up" else -.05
            self.audio.set_volume(round(max(0, min(1, self.audio.volume + delta)), 2))
            self.last_action = f"Volume {self.audio.volume:.0%}"
        elif button == "center":
            if self.drawing:
                letter = self.drawing.catalog.letter_for_image(self.gallery.paths[self.gallery.index])
                if letter is None:
                    self.last_action = "No drawing for this card"
                    return
                if self.drawing.state() is not None and self.drawing.active == letter:
                    # Pressing again while the letter is still being drawn does not restart it.
                    self.last_action = f"Still drawing {letter}"
                    return
                if self.animation:
                    self.animation.stop()
                self.audio.stop()
                duration = self.letter_recordings.play(letter) if self.letter_recordings else 0
                self.drawing.start(letter, audio_seconds=duration)
                self.last_action = f"Drawing {letter}"
                return
            if not self.sounds:
                self.last_action = "Audio disabled"
            elif self.audio.playing:
                self.audio.stop()
                self.last_action = "Stopped"
            else:
                self.audio.play(self.sounds[0])
                self.last_action = "Playing"

    def frame(self):
        if self.drawing:
            frame = self.drawing.frame()
            if frame is not None:
                return frame
        if self.animation:
            frame = self.animation.frame()
            if frame is not None:
                return frame
        if self.fullscreen:
            from PIL import Image
            with Image.open(self.gallery.paths[self.gallery.index]) as image:
                return image.convert("RGB")
        return player_frame(self.gallery, self.audio,
                            self.sounds[0].name if self.sounds else "Audio disabled", self.last_action)

    def render_key(self):
        if self.drawing:
            key = self.drawing.render_key()
            if self.drawing.active:
                return (self.gallery.index, "drawing", key)
        if self.animation:
            return (self.gallery.index, self.animation.render_key())
        if self.fullscreen:
            return (self.gallery.index,)
        return (self.gallery.index, round(self.audio.volume * 100), self.audio.playing,
                int(self.audio.position * 4), self.last_action)
