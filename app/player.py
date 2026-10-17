import random

from .ui import Gallery, player_frame


# Select the character once, then use its matching prepared recording after the slide.
PRAISE_CLIPS = {"clapping": 2, "hemulen": 1}


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
        self.hold_clock = None
        self.card_motion = None
        self.idle = None
        self.pending_character = None

    def card(self):
        from PIL import Image
        with Image.open(self.gallery.paths[self.gallery.index]) as image:
            return image.convert("RGB")

    def release(self, button):
        if button == "center" and self.hold_clock:
            if self.drawing:
                self.drawing.state()
            self.hold_clock.hold(False)

    def start_character(self, button):
        choices = ("speaking",) if button == "up" else tuple(PRAISE_CLIPS)
        if self.pending_character and self.pending_character[1] == button:
            return
        if self.animation.index() is not None and self.animation.active in choices:
            return
        name = choices[0] if button == "up" else random.choice(choices)
        old = self.frame()
        self.stop_drawing()
        self.animation.stop()
        self.audio.stop()
        self.pending_character = (name, button)
        first = self.animation.first_frame(name)
        if self.card_motion:
            self.card_motion.start(old, first, button)
        else:
            self.update_character()

    def update_character(self):
        if self.pending_character is None:
            return
        if self.card_motion and self.card_motion.render_key() is not None:
            return
        name, button = self.pending_character
        self.pending_character = None
        duration = 0
        if self.letter_recordings:
            duration = (self.letter_recordings.ask() if button == "up"
                        else self.letter_recordings.praise(PRAISE_CLIPS[name]))
        # Animation and speech both begin after the first frame finishes sliding in.
        self.animation.start(name, minimum_seconds=duration)

    def feedback(self, button, accepted=True):
        name = "tick" if not accepted else "whoosh" if button in ("left", "right") else "pop" if button == "center" else "tick"
        self.audio.effect(name)

    def stop_drawing(self):
        if self.drawing and self.drawing.active:
            self.drawing.stop()
            self.audio.stop()
        if self.hold_clock:
            self.hold_clock.hold(False)

    @property
    def animation_fps(self):
        if self.idle and self.idle.peeking:
            return 10
        if self.card_motion and self.card_motion.active:
            return self.card_motion.fps
        if self.drawing and self.drawing.active:
            return self.drawing.fps
        return self.animation.fps if self.animation else None

    def action(self, button):
        if self.drawing and button in ("up", "down"):
            if self.animation:
                self.start_character(button)
                self.last_action = "Which letter?" if button == "up" else "Bravo!"
                return
            self.stop_drawing()
            if self.animation:
                self.animation.stop()
            if self.card_motion:
                card = self.card()
                self.card_motion.start(card, card, button)
            letter = self.drawing.catalog.letter_for_image(self.gallery.paths[self.gallery.index])
            self.audio.stop()
            if self.letter_recordings and letter:
                if button == "up":
                    self.letter_recordings.play(letter)
                else:
                    self.letter_recordings.repeat()
            self.last_action = "Listen" if button == "up" else "Say it with me"
            return
        if button in ("left", "right"):
            old = self.frame() if self.card_motion else None
            self.pending_character = None
            self.stop_drawing()
            if self.drawing:
                self.audio.stop()
            if self.animation:
                self.animation.stop()
            self.gallery.navigate(button)
            if self.card_motion:
                self.card_motion.start(old, self.card(), button)
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
                self.pending_character = None
                if self.card_motion:
                    self.card_motion.stop()
                if self.hold_clock:
                    self.hold_clock.hold(True)
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
        self.update_character()
        if self.idle and self.idle.peeking:
            return self.idle.frame(self.card())
        if self.card_motion:
            frame = self.card_motion.frame()
            if frame is not None:
                return frame
        if self.drawing:
            frame = self.drawing.frame()
            if frame is not None:
                return frame
        if self.animation:
            frame = self.animation.frame()
            if frame is not None:
                return frame
        if self.fullscreen:
            return self.card()
        return player_frame(self.gallery, self.audio,
                            self.sounds[0].name if self.sounds else "Audio disabled", self.last_action)

    def render_key(self):
        self.update_character()
        if self.idle and (self.idle.peeking or self.idle.sleeping):
            return (self.gallery.index, "idle", self.idle.render_key())
        if self.card_motion:
            key = self.card_motion.render_key()
            if key is not None:
                return (self.gallery.index, "card", key)
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
