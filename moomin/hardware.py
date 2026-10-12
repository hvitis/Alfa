"""Small direct drivers: SPI ST7789 display and I²C ADS1x15 A0 input."""
import sys
import time
from array import array

from PIL import Image


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


class ST7789:
    def __init__(self, settings):
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
            self.command(0x01)  # Software reset.
            time.sleep(0.15)
            self.command(0x11)  # Exit sleep.
            time.sleep(0.12)
            self.command(0x36, [0x08 if self.cfg["bgr"] else 0x00])
            self.command(0x3A, [0x55])  # RGB565, 16 bits per pixel.
            for command, data in (
                (0xB2, [0x0C, 0x0C, 0x00, 0x33, 0x33]),
                (0xB7, [0x35]), (0xBB, [0x1F]), (0xC0, [0x2C]),
                (0xC2, [0x01]), (0xC3, [0x12]), (0xC4, [0x20]),
                (0xC6, [0x0F]), (0xD0, [0xA4, 0xA1]),
                (0xE0, [0xD0, 0x08, 0x11, 0x08, 0x0C, 0x15, 0x39, 0x33, 0x50, 0x36, 0x13, 0x14, 0x29, 0x2D]),
                (0xE1, [0xD0, 0x08, 0x10, 0x08, 0x06, 0x06, 0x39, 0x44, 0x51, 0x0B, 0x16, 0x14, 0x2F, 0x31]),
            ):
                self.command(command, data)
            self.command(0x21 if self.cfg["invert"] else 0x20)
            self.command(0x13)  # Normal display mode.
            self.command(0x29)  # Display on.
            time.sleep(0.02)
            self.show(Image.new("RGB", self.size, "black"))
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

    def close(self):
        if self.backlight:
            self.backlight.off()
        for pin in (self.backlight, self.dc, self.reset):
            if pin:
                pin.close()
        self.spi.close()
        self.factory.close()


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
