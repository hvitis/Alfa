"""Release the early boot display before another process claims its GPIOs."""
import socket


SPLASH_SOCKET = "/run/moomin-splash/handoff.sock"


def release_boot_splash(path=SPLASH_SOCKET):
    with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as connection:
        connection.settimeout(3)
        try:
            connection.connect(str(path))
        except (FileNotFoundError, ConnectionRefusedError):
            # Normal after the one-time splash exits, or without its service.
            return
        connection.sendall(b"handoff")
        if connection.recv(32) != b"released":
            raise RuntimeError("The boot splash did not release the display.")
