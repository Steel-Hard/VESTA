import board
import displayio
import time
from fourwire import FourWire
from adafruit_display_text import label
import adafruit_gc9a01a
from adafruit_bitmap_font import bitmap_font

displayio.release_displays()

spi = board.SPI()
tft_cs = board.D4
tft_dc = board.D2
tft_rst = board.D22

display_bus = FourWire(spi, command=tft_dc, chip_select=tft_cs, reset=tft_rst)
display = adafruit_gc9a01a.GC9A01A(display_bus, width=240, height=240)

splash = displayio.Group()
display.root_group = splash

color_bitmap = displayio.Bitmap(240, 240, 1)
color_palette = displayio.Palette(1)
color_palette[0] = 0x000000
bg_sprite = displayio.TileGrid(color_bitmap, pixel_shader=color_palette, x=0, y=0)
splash.append(bg_sprite)

font = bitmap_font.load_font("/lib/fonts/Helvetica-Bold-16.bdf")

clock_label = label.Label(
    font,
    text="--:--",
    color=0x7353BA,
    scale=4,
    anchor_point=(0.5, 0.5),
    anchored_position=(120, 120)
)
splash.append(clock_label)

while True:
    now = time.localtime()
    current_time = "{:02}:{:02}".format(now.tm_hour, now.tm_min)
    clock_label.text = current_time
    time.sleep(30)

