# Boot splash artwork

`waving.png` is the source for both the firmware splash and the Linux loading screen.
It shows a white character waving on pale pastel blue. Preparation scales it to the LCD and adds the existing loading label.

Generated with the built-in image generation tool on 17 October 2026.
Prompt summary: “A portrait 3:4 boot illustration: one friendly white storybook character waving hello, clean navy outlines,
minimal blue shading, pale pastel blue background #D5EAF5, full character visible, bottom space for a loading label,
no scenery, extra characters, text, border, or watermark.”

Run `make firmware-splash` to update the local preview and binary.
On the Pi, run `make restart` and `make firmware-splash-install` to update both loading screens.
See [the installation and recovery guide](../../docs/early-boot-splash.md).
