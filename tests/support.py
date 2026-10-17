"""Explicit photo-mode settings for tests of the optional generic player."""
from app.config import Settings


def photo_settings(root):
    settings = Settings(root, Settings.load().data)
    settings.data["images"].update(input="imgs", prepared="media/images", background="#ffffff")
    settings.data["animations"]["enabled"] = False
    settings.data["letter_drawing"]["enabled"] = False
    settings.data["lesson"]["letters"] = "all"
    return settings
