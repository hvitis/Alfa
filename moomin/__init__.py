"""Backward-compatibility shim redirecting 'moomin' imports to 'app'."""
import importlib
import sys
from importlib.abc import MetaPathFinder, Loader

class _MoominRedirectFinder(MetaPathFinder):
    def find_spec(self, fullname, path, target=None):
        if fullname == "moomin":
            return importlib.util.find_spec("app")
        if fullname.startswith("moomin."):
            app_name = "app." + fullname[len("moomin."):]
            try:
                spec = importlib.util.find_spec(app_name)
                if spec is not None:
                    # Point to app's module loader but register under moomin name
                    return importlib.util.spec_from_loader(
                        fullname,
                        _MoominRedirectLoader(fullname, app_name),
                    )
            except Exception:
                pass
        return None

class _MoominRedirectLoader(Loader):
    def __init__(self, fullname, app_name):
        self.fullname = fullname
        self.app_name = app_name

    def create_module(self, spec):
        return None  # default module creation

    def exec_module(self, module):
        app_mod = importlib.import_module(self.app_name)
        sys.modules[self.fullname] = app_mod
        module.__dict__.update(app_mod.__dict__)

if not any(isinstance(finder, _MoominRedirectFinder) for finder in sys.meta_path):
    sys.meta_path.insert(0, _MoominRedirectFinder())

def __getattr__(name):
    return getattr(importlib.import_module("app"), name)
