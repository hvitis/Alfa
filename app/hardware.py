"""Small direct drivers: SPI ST7789 display and I²C ADS1x15 A0 input."""
import sys
import time
from array import array

from PIL import Image

from .display_init import st7789_commands


def rgb565(image):
    pixels = iter(image.convert("RGB").tobytes())
    words = array("H", (((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3) for r, g, b in zip(pixels, pixels, pixels)))
    if sys.byteorder == "little":
        words.byteswap()
    return words.tobytes()


class PreviewDisplay:
    def __init__(self, settings):
        self.directory = settings.state / "preview"
        self.directory.mkdir(parents=True, exist_ok=True)
        self.size = settings.size

    def show(self, frame, name="current"):
        if frame.size != self.size:
            raise ValueError(f"Frame must be {self.size}.")
        frame.save(self.directory / f"{name}.png")
        frame.save(self.directory / "current.png")

    def close(self):
        pass

    def set_awake(self, awake):
        self.awake = awake


class ST7789:
    async_frames = True
    def __init__(self, settings, initial_payload=None):
        from .display_handoff import release_boot_splash

        release_boot_splash()
        import spidev
        from gpiozero import OutputDevice
        from gpiozero.pins.lgpio import LGPIOFactory

        self.cfg = settings.data["display"]
        self.size = settings.size
        self.factory = LGPIOFactory()
        self.spi = spidev.SpiDev()
        self.dc = self.reset = self.backlight = None
        try:
            self.backlight = OutputDevice(self.cfg["backlight_pin"], initial_value=False, pin_factory=self.factory)
            self.dc = OutputDevice(self.cfg["dc_pin"], initial_value=False, pin_factory=self.factory)
            self.reset = OutputDevice(self.cfg["reset_pin"], initial_value=True, pin_factory=self.factory)
            self.spi.open(self.cfg["spi_bus"], self.cfg["spi_device"])
            self.spi.max_speed_hz = self.cfg["spi_hz"]
            self.spi.mode = 0
            self.reset.off()
            time.sleep(0.02)
            self.reset.on()
            time.sleep(0.12)
            for command, data, delay_us in st7789_commands(self.cfg):
                self.command(command, data)
                if delay_us:
                    time.sleep(delay_us / 1_000_000)
            if initial_payload is None:
                self.show(Image.new("RGB", self.size, "black"))
            else:
                self.show_rgb565(initial_payload)
            self.backlight.on()
        except BaseException:
            self.close()
            raise

    def command(self, command, data=None):
        self.dc.off()
        self.spi.writebytes([command])
        if data:
            self.dc.on()
            self.spi.writebytes2(bytes(data))

    def show(self, frame, name="current"):
        if frame.size != self.size:
            raise ValueError(f"Frame must be {self.size}.")
        frame = frame.rotate(self.cfg["rotation"], expand=True)
        self.show_rgb565(rgb565(frame))

    def show_rgb565(self, payload):
        """Send a native 240x320 frame already encoded in ST7789 wire byte order."""
        if len(payload) != 240 * 320 * 2:
            raise ValueError("RGB565 payload must contain exactly 153600 bytes.")
        self.command(0x2A, [0, 0, 0, 239])
        self.command(0x2B, [0, 0, 1, 63])
        self.command(0x2C)
        self.dc.on()
        self.spi.writebytes2(payload)

    def show_region(self, frame, box):
        """Transfer an exclusive logical rectangle, including display rotation."""
        left, top, right, bottom = box
        width, height = self.size
        if not (0 <= left < right <= width and 0 <= top < bottom <= height):
            raise ValueError("Display region must be inside the logical screen.")
        if frame.size != (right - left, bottom - top):
            raise ValueError("Cropped frame must match the display region.")
        rotation = self.cfg["rotation"]
        if rotation == 180:
            left, top, right, bottom = width - right, height - bottom, width - left, height - top
        elif rotation == 90:
            left, top, right, bottom = top, width - right, bottom, width - left
        elif rotation == 270:
            left, top, right, bottom = height - bottom, left, height - top, right
        payload = rgb565(frame.rotate(rotation, expand=True))
        self.command(0x2A, [left >> 8, left & 255, (right - 1) >> 8, (right - 1) & 255])
        self.command(0x2B, [top >> 8, top & 255, (bottom - 1) >> 8, (bottom - 1) & 255])
        self.command(0x2C)
        self.dc.on()
        self.spi.writebytes2(payload)

    def close(self):
        if self.backlight:
            self.backlight.off()
        for pin in (self.backlight, self.dc, self.reset):
            if pin:
                pin.close()
        self.spi.close()
        self.factory.close()

    def set_awake(self, awake):
        self.backlight.on() if awake else self.backlight.off()


class Amplifier:
    """MAX98357A SD control. LOW sleeps, HIGH selects the left audio channel."""
    def __init__(self, settings, factory):
        from gpiozero import OutputDevice
        pin = settings.data["audio"].get("shutdown_pin")
        self.pin = OutputDevice(pin, initial_value=True, pin_factory=factory) if pin is not None else None

    def set_awake(self, awake):
        if self.pin:
            self.pin.on() if awake else self.pin.off()

    def close(self):
        if self.pin:
            self.pin.off()
            self.pin.close()


class LatestDisplay:
    """Send only the latest requested frame; SPI must never delay button polling."""
    def __init__(self, display):
        import threading
        self.display = display
        self.pending = None
        self.error = None
        self.lock, self.changed = threading.Lock(), threading.Event()
        self.stopping = False
        self.worker = threading.Thread(target=self._run, daemon=True)
        self.worker.start()

    def _submit(self, kind, payload):
        self.check()
        with self.lock:
            self.pending = kind, payload
        self.changed.set()

    def check(self):
        if self.error:
            raise self.error

    def show(self, frame, name="current"):
        self._submit("image", frame.copy())

    def show_rgb565(self, payload):
        self._submit("wire", payload)

    def set_awake(self, awake):
        self.display.set_awake(awake)

    def _run(self):
        from .frames import AnimationPresenter
        presenter = AnimationPresenter(self.display)
        try:
            while True:
                self.changed.wait()
                self.changed.clear()
                with self.lock:
                    pending, self.pending = self.pending, None
                if pending:
                    kind, payload = pending
                    if kind == "wire":
                        presenter.reset()
                        self.display.show_rgb565(payload)
                    else:
                        presenter.show(payload)
                with self.lock:
                    if self.stopping and self.pending is None:
                        break
        except Exception as error:
            self.error = error

    def close(self):
        self.stopping = True
        self.changed.set()
        self.worker.join(timeout=3)
        if self.worker.is_alive():
            raise RuntimeError("The display worker did not stop.")
        self.check()


def adc_voltage(raw, model):
    signed = raw - 65536 if raw & 0x8000 else raw
    return ((signed >> 4) / 2048 if model == "ads1015" else signed / 32768) * 4.096


class ADS1x15:
    def __init__(self, settings, bus=None):
        self.model = settings.data["adc"]["model"]
        self.address = settings.address
        if bus is None:
            from smbus2 import SMBus
            bus = SMBus(settings.data["adc"]["bus"])
        self.bus = bus

    def read_register(self, register):
        data = self.bus.read_i2c_block_data(self.address, register, 2)
        return (data[0] << 8) | data[1]

    def read_voltage(self):
        # Start single-shot A0-to-GND conversion, ±4.096 V range.
        # DR=100: ADS1115 128 SPS / ADS1015 1600 SPS; comparator disabled.
        config = 0x8000 | 0x4000 | 0x0200 | 0x0100 | 0x0080 | 0x0003
        self.bus.write_i2c_block_data(self.address, 1, [config >> 8, config & 255])
        deadline = time.monotonic() + 0.15
        time.sleep(0.001)
        while not self.read_register(1) & 0x8000:
            if time.monotonic() > deadline:
                raise RuntimeError("ADC conversion timed out. Check the chip, power and I²C wiring.")
            time.sleep(0.001)
        voltage = adc_voltage(self.read_register(0), self.model)
        if not -0.05 <= voltage <= 3.15:
            raise RuntimeError(f"ADC A0 is {voltage:.3f} V. Stop and check the 5 V button output divider.")
        return voltage

    def close(self):
        self.bus.close()
