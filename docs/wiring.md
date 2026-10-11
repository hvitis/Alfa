# Raspberry Pi: LCD, speaker, and analog buttons

This guide connects these devices to a Raspberry Pi 3 Model B or Raspberry Pi 2 Model B:

- Waveshare 2-inch IPS LCD, 240 × 320 pixels, SPI ST7789, SKU 17344.
- A passive 3 W / 4 Ω speaker.
- An AD-Key module with five buttons and one analog `OUT` signal, rated for 5 V DC.

Both Raspberry Pi models use the same connections in this guide.

**All Pi pin numbers refer to physical positions on the 40-pin header.**
GPIO numbers use BCM numbering and appear separately.
For example, physical pin **22** is **GPIO25**.

## Wiring diagram

[Open the rotatable 3D wiring diagram](../output/wiring-3d.html) · [View its PNG overview](../output/wiring-3d-overview.png) · [Read the photo-specific wiring notes](../output/wiring-notes.md).

The 3D diagram shows all working devices connected to one Pi, with an enlarged header and numbered cables in separate lanes. Click a cable or connection table row to show only that connection. The group controls show only the cables for one device. It uses the photographed ADS1115/ADS1015 breakout and shows the green PAM8403 amplifier as an unused alternative. ADC and amplifier terminal layouts are schematic; match their printed labels. The Pi header has explicit physical pin positions.

Separate cable views: [LCD](../output/wiring-lcd.png) · [Amplifier and speaker](../output/wiring-audio.png) · [ADC](../output/wiring-adc.png) · [Keypad and resistors](../output/wiring-keypad.png).

![LCD, speaker, and button connections](../raspberry-pi-lcd-speaker-adkey.png)

[Open the PNG diagram](../raspberry-pi-lcd-speaker-adkey.png) · [Open the scalable SVG diagram](../raspberry-pi-lcd-speaker-adkey.svg)

The diagram shows electrical connections, not the physical order of pins on each module.
The Pi blocks in all three sections represent the same Raspberry Pi.

## Additional parts

| Part | Quantity | Purpose |
|---|---:|---|
| MAX98357A I²S mono amplifier breakout | 1 | Drives the passive speaker |
| ADS1115 ADC breakout | 1 | Converts the button voltage to a digital value over I²C |
| 10 kΩ resistor | 2 | Reduces the button output voltage for the ADC |
| Jumper wires and a breadboard or soldered connections | As required | Connects the modules |
| Suitable 5 V supply for the Pi | 1 | Supplies the Pi and modules, including the amplifier |

The amplifier connections assume an Adafruit-style MAX98357A breakout with its default `SD` pull-up.

The Pi has no analog input for the AD-Key signal.
The speaker needs an amplifier because a GPIO output cannot drive a 4 Ω speaker.

## Wiring procedure

1. Shut down the Pi.
2. Disconnect the power supply.
3. Connect the modules with the tables below.
4. Connect all module grounds to the Pi ground.
5. Make sure that the connections match the labels printed on each module.
6. Reconnect the power supply after the wiring is complete.

**CAUTION:** Do not connect AD-Key `OUT` directly to a Pi GPIO or the ADC input.
Its output can reach 5 V.
Use the resistor divider in this guide.

**CAUTION:** Connect the speaker only to amplifier `OUT+` and `OUT−`.
Neither speaker terminal connects to ground.

Cable colors can differ between products.
The printed pin labels determine the connections.

## LCD connections

| LCD label | Pi signal | Physical Pi pin |
|---|---|---:|
| `VCC` | 3.3 V | **1** |
| `GND` | Ground | **6** |
| `DIN` | GPIO10 / SPI MOSI | **19** |
| `CLK` | GPIO11 / SPI clock | **23** |
| `CS` | GPIO8 / SPI CE0 | **24** |
| `DC` | GPIO25 | **22** |
| `RST` | GPIO27 | **13** |
| `BL` | GPIO24 / backlight control | **18** |

The LCD uses 3.3 V power in this guide.
It does not need an SPI MISO connection.

**The backlight connection differs from the original LCD-only instructions.**
The original connection used GPIO18, physical pin 12.
The amplifier now uses that GPIO for its audio clock.
The combined wiring moves LCD `BL` to GPIO24, physical pin 18.

Before running LCD software, change its backlight GPIO setting from BCM **18** to BCM **24**.
Do not run the unmodified demo with the amplifier connected.
The unmodified demo can configure the audio clock GPIO as a backlight output.

Source: [Waveshare LCD pinout and setup](https://www.waveshare.com/wiki/2inch_LCD_Module).
The backlight reassignment is specific to this combined wiring.

## Amplifier and speaker connections

| MAX98357A label | Pi signal | Physical Pi pin |
|---|---|---:|
| `VIN` | 5 V | **2** |
| `GND` | Ground | **9** |
| `BCLK` | GPIO18 / I²S bit clock | **12** |
| `LRC` or `LRCLK` | GPIO19 / I²S channel clock | **35** |
| `DIN` | GPIO21 / I²S audio data | **40** |

| Amplifier output | Speaker terminal |
|---|---|
| `OUT+` | Positive (`+`) |
| `OUT−` | Negative (`−`) |

The Adafruit-style breakout uses its default settings with `SD` and `GAIN` unconnected.
Other breakout designs can have different defaults.

The amplifier accepts the Pi's 3.3 V audio signals while its power supply uses 5 V.
Its output supports a 4 Ω speaker.
The amplifier needs additional supply current, especially at high volume.

Sources: [MAX98357A Raspberry Pi wiring](https://learn.adafruit.com/adafruit-max98357-i2s-class-d-mono-amp/raspberry-pi-wiring),
[amplifier pin descriptions](https://learn.adafruit.com/adafruit-max98357-i2s-class-d-mono-amp/pinouts),
and [amplifier specifications](https://www.adafruit.com/product/3006).

## ADC and button connections

### ADS1115 ADC

| ADS1115 label | Connection | Physical Pi pin |
|---|---|---:|
| `VDD` or `VCC` | 3.3 V | **17** |
| `GND` | Ground | **20** |
| `SDA` | GPIO2 / I²C data | **3** |
| `SCL` | GPIO3 / I²C clock | **5** |
| `ADDR` | ADC ground, for address `0x48` | Ground connection |
| `A0` | Junction of the two resistors | No direct Pi connection |

The ADC uses 3.3 V power to keep its I²C signals compatible with the Pi.
The ADC input voltage must stay within its supply voltage.
The programmable measurement range does not increase this voltage limit.

Leave unused ADC inputs and `ALERT` unconnected.

Source: [ADS1115 power, input limits, and addressing](https://learn.adafruit.com/adafruit-4-channel-adc-breakouts/assembly-and-wiring).

### AD-Key module

| AD-Key label | Connection | Physical Pi pin |
|---|---|---:|
| `VCC` | 5 V | **4** |
| `GND` | Ground | **14** |
| `OUT` | First 10 kΩ resistor, R1 | No direct Pi connection |

### Resistor divider

```text
AD-Key OUT ── R1: 10 kΩ ──┬── ADS1115 A0
                         │
                     R2: 10 kΩ
                         │
                        GND
```

1. Connect AD-Key `OUT` to one end of R1.
2. Connect the other end of R1 to ADS1115 `A0`.
3. Connect one end of R2 to that same junction.
4. Connect the other end of R2 to ground.

The two equal resistors reduce the voltage by approximately half:

```text
V_A0 = V_OUT × R2 / (R1 + R2)
     = V_OUT × 0.5
```

An output of 5 V becomes about 2.5 V at `A0`.
The button module's internal resistance can also affect the measured voltage.
Software calibration accounts for this effect.

## Raspberry Pi OS configuration

### Enable SPI and I²C

Run this command on the Pi:

```bash
sudo raspi-config
```

1. Select **Interface Options → SPI → Yes**.
2. Select **Interface Options → I2C → Yes**.
3. Exit the configuration tool.
4. Restart the Pi:

   ```bash
   sudo reboot
   ```

Older versions can label this menu **Interfacing Options**.

### Configure the amplifier

Open the configuration file:

```bash
sudo nano /boot/firmware/config.txt
```

On older Raspberry Pi OS versions, use `/boot/config.txt` instead.

If the file contains `dtparam=audio=on`, comment out that line:

```ini
#dtparam=audio=on
```

Add this line once:

```ini
dtoverlay=max98357a,no-sdmode
```

Save the file and restart the Pi:

```bash
sudo reboot
```

Select the I²S sound device in the audio configuration for your application.
The wiring alone does not select the amplifier as the audio output.

Source: [Adafruit MAX98357A Raspberry Pi configuration](https://learn.adafruit.com/adafruit-max98357-i2s-class-d-mono-amp/raspberry-pi-usage).

### Download and run the LCD example

Run these commands on the Pi:

```bash
sudo apt update
sudo apt install unzip wget
wget https://www.waveshare.net/w/upload/8/8d/LCD_Module_RPI_code.zip
unzip LCD_Module_RPI_code.zip
```

Before running the example, change the library's backlight GPIO setting from BCM **18** to BCM **24**.
The setting is in the GPIO configuration used by the LCD library, not necessarily in the example file.

After that change, run:

```bash
cd LCD_Module_RPI_code/RaspberryPi/python/examples
sudo python3 2inch_LCD_test.py
```

The example displays graphics on the LCD.
Showing the Pi desktop requires additional display-driver configuration.
Enabling SPI alone does not display the desktop.

Python dependencies depend on the Raspberry Pi OS version.
The manufacturer guide lists the dependencies and instructions for older versions.

Source: [Waveshare Raspberry Pi example and installation guide](https://docs.waveshare.net/2inch_LCD_Module/User-Guide-Rpi/).

### Read and calibrate the buttons

Use an ADS1115 library to read `A0` relative to ground.
A measurement range of ±4.096 V covers the divider output.
The ADC still uses 3.3 V power.

1. Read the voltage with no button pressed.
2. Read the voltage for each of the five buttons separately.
3. Record the six states: idle and the five buttons.
4. Set detection thresholds between the measured values.
5. Add software debounce to reject brief changes during a button press.

The resistor values inside the button module determine its output levels.
Use measurements from the assembled circuit instead of assumed voltage thresholds.

Source: [ADS1115 Python library and Raspberry Pi connections](https://learn.adafruit.com/adafruit-4-channel-adc-breakouts/python-circuitpython).

## Reference

[Raspberry Pi hardware documentation](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html)
describes the Pi models and their GPIO headers.
