from .ui import Gallery, player_frame


class PlayerSession:
    """Actions shared by physical buttons, SSH keys, and hardware-free tests."""
    def __init__(self, images, sounds, audio):
        self.gallery = Gallery(images)
        self.sounds = sounds
        self.audio = audio
        self.last_action = "Ready"

    def action(self, button):
        if button in ("left", "right"):
            self.gallery.navigate(button)
            self.last_action = "Previous photo" if button == "left" else "Next photo"
        elif button in ("up", "down"):
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
        return player_frame(self.gallery, self.audio,
                            self.sounds[0].name if self.sounds else "Audio disabled", self.last_action)

    def render_key(self):
        return (self.gallery.index, round(self.audio.volume * 100), self.audio.playing,
                int(self.audio.position * 4), self.last_action)
