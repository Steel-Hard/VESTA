import board
import displayio
import digitalio
import terminalio
import busio
import pulseio
from time import sleep
from adafruit_display_text import label
from fourwire import FourWire

from adafruit_st7789 import ST7789

displayio.release_displays()

spi = busio.SPI(board.LCD_CLK,board.LCD_MOSI)
tft_cs = board.LCD_CS
tft_dc = board.LCD_DC
tft_bl = board.LCD_BACKLIGHT
LED = board.LED

display_bus = FourWire(spi, command=tft_dc, chip_select=tft_cs)
display = ST7789(display_bus, rotation=90, width=240, height=135, rowstart=40, colstart=53)

# Make the display context
splash = displayio.Group()
display.root_group = splash


odb = displayio.OnDiskBitmap('/images/logo.bmp')
bg_sprite = displayio.TileGrid(odb, pixel_shader=odb.pixel_shader, x=0, y=0)
splash.append(bg_sprite)

lcd_bl = digitalio.DigitalInOut(tft_bl)
lcd_bl.direction = digitalio.Direction.OUTPUT
lcd_bl.value = True

    