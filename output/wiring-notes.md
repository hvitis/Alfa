# Complete wiring for the photographed parts

All Pi pin numbers below are **physical positions**, not GPIO numbers.
Disconnect Pi power before wiring. Connect the power supply to the Pi's micro-USB power socket after checking the connections.

The purple MAX98357A drives the speaker in this setup. The green PAM8403 board with the knob is an alternative amplifier and stays disconnected. Do not connect MAX98357A speaker outputs to PAM8403 inputs or connect both amplifier outputs to the same speaker.

The purple ADC board is marked ADS1115/ADS1015. Its exact chip variant and the front-side terminal order are not visible in the photos. Both variants use the connections below. Match the printed terminal labels; select the matching chip driver in software.

| Module | Terminal | Connect to |
|---|---|---|
| LCD | VCC | Pi pin 1, 3.3 V |
| LCD | GND | Pi pin 6 |
| LCD | DIN | Pi pin 19, GPIO10 |
| LCD | CLK | Pi pin 23, GPIO11 |
| LCD | CS | Pi pin 24, GPIO8 |
| LCD | DC | Pi pin 22, GPIO25 |
| LCD | RST | Pi pin 13, GPIO27 |
| LCD | BL | Pi pin 18, GPIO24 |
| MAX98357A | VIN | Pi pin 2, 5 V |
| MAX98357A | GND | Pi pin 9 |
| MAX98357A | BCLK | Pi pin 12, GPIO18 |
| MAX98357A | LRC / LRCLK | Pi pin 35, GPIO19 |
| MAX98357A | DIN | Pi pin 40, GPIO21 |
| MAX98357A | OUT+ | Speaker positive terminal |
| MAX98357A | OUT− | Speaker negative terminal, **not ground** |
| ADC | VDD / VCC | Pi pin 17, 3.3 V |
| ADC | GND | Pi pin 20 |
| ADC | SDA | Pi pin 3, GPIO2 |
| ADC | SCL | Pi pin 5, GPIO3 |
| ADC | ADDR | ADC GND, address 0x48 |
| ADC | A0 | Junction of R1 and R2 |
| AD-Key | VCC | Pi pin 4, 5 V |
| AD-Key | GND | Pi pin 14 |
| AD-Key | OUT | R1, 10 kΩ |

Add two 10 kΩ resistors, which are not shown in the photographs:

```text
AD-Key OUT ── R1 10 kΩ ──┬── ADC A0
                        │
                     R2 10 kΩ
                        │
                      ADC GND
```

The divider reduces a 5 V output to about 2.5 V. Do not connect the button output directly to a Pi GPIO or to the ADC powered at 3.3 V. Calibrate button thresholds after assembly.

Leave ADC ALERT and A1–A3 unconnected. Leave MAX98357A GAIN unconnected for the default gain. Leaving SD unconnected assumes the breakout has its default SD pull-up; confirm the front of your board before relying on it. A board without that pull-up needs its manufacturer's SD/MODE wiring.

Use soldered headers or soldered wires for bare PCB pads. A jumper pressed into an unsoldered hole is not a reliable connection. Use the LCD's labeled eight-pin connector or soldered header pads, not the Pi's display ribbon connector.

Set LCD backlight to **BCM GPIO24** in software, rather than the manufacturer's default GPIO18, because GPIO18 is used by I²S audio. Enable SPI and I²C and configure the MAX98357A audio driver as described in the project README. All module grounds above are connected together internally by the Pi.

Use these tables and the boards' printed labels for exact connections. The generated 3D illustration shows the assembly layout; unseen ADC and amplifier header order is not verified from the photos.

Sources: [Waveshare LCD pinout](https://www.waveshare.com/wiki/2inch_LCD_Module), [Adafruit MAX98357A Pi wiring](https://learn.adafruit.com/adafruit-max98357-i2s-class-d-mono-amp/raspberry-pi-wiring), [MAX98357A output and SD details](https://learn.adafruit.com/adafruit-max98357-i2s-class-d-mono-amp/pinouts), [ADS1115/ADS1015 power and wiring](https://learn.adafruit.com/adafruit-4-channel-adc-breakouts/assembly-and-wiring).
