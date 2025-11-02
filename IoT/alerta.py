import board
import displayio
import time
from fourwire import FourWire
from adafruit_display_text import label
import adafruit_gc9a01a
from adafruit_bitmap_font import bitmap_font
import vectorio

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

circle_group = displayio.Group()
splash.append(circle_group)

font = bitmap_font.load_font("/lib/fonts/Helvetica-Bold-16.bdf")
alert_label = label.Label(
    font,
    text="QUEDA!",
    color=0xFF0000,
    scale=3,
    anchor_point=(0.5, 0.5),
    anchored_position=(120, 120)
)
splash.append(alert_label)

circle_palette = displayio.Palette(1)
circle_palette[0] = 0xFFFFFF

current_circle = None
is_red = True

while True:
    for radius in range(5, 110, 3):
        if current_circle:
            circle_group.remove(current_circle)
        
        current_circle = vectorio.Circle(pixel_shader=circle_palette, radius=radius, x=120, y=120)
        circle_group.append(current_circle)
        
        if is_red:
            alert_label.color = 0x000000
        else:
            alert_label.color = 0xFF0000
        is_red = not is_red
        
        time.sleep(0.1)
    
    if current_circle:
        circle_group.remove(current_circle)
        current_circle = None
    time.sleep(0.1)