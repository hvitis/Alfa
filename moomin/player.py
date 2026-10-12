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

    def action(self, button):
        if button in ("left", "right"):
            if self.animation:
                self.animation.stop()
            self.gallery.navigate(button)
            self.last_action = "Previous photo" if button == "left" else "Next photo"
        elif button in ("up", "down"):
            if self.animation:
                name = "listening" if button == "up" else "speaking"
                self.animation.start(name)
                self.last_action = name.capitalize()
                return
            delta = .05 if button == "up" else -.05
            self.audio.set_volume(round(max(0, min(1, self.audio.volume + delta)), 2))
            self.last_action = f"Volume {self.audio.volume:.0%}"
        elif button == "center":
            if not self.sounds:
                self.last_action = "Audio disabled"
            elif self.audio.playing:
                self.audio.stop()
                self.last_action = "Stopped"
            else:
                self.audio.play(self.sounds[0])
                self.last_action = "Playing"

    def frame(self):
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
        if self.animation:
            return (self.gallery.index, self.animation.render_key())
        if self.fullscreen:
            return (self.gallery.index,)
        return (self.gallery.index, round(self.audio.volume * 100), self.audio.playing,
                int(self.audio.position * 4), self.last_action)
