import board
import displayio
import terminalio
import time
from fourwire import FourWire
from adafruit_display_text import label
import adafruit_gc9a01a
from adafruit_bitmap_font import bitmap_font

# Libera os displays
displayio.release_displays()

# Configurações do SPI e pinos
spi = board.SPI()
tft_cs = board.D4
tft_dc = board.D2
tft_rst = board.D22

# Inicializa o display
display_bus = FourWire(spi, command=tft_dc, chip_select=tft_cs, reset=tft_rst)
display = adafruit_gc9a01a.GC9A01A(display_bus, width=240, height=240)

# Fonte padrão
font = terminalio.FONT

# Grupo de exibição
splash = displayio.Group()
display.root_group = splash

# Fundo preto
color_bitmap = displayio.Bitmap(240, 240, 1)
color_palette = displayio.Palette(1)
color_palette[0] = 0x000000  # Preto
bg_sprite = displayio.TileGrid(color_bitmap, pixel_shader=color_palette, x=0, y=0)
splash.append(bg_sprite)

# Dados BPM
bpm_label = label.Label(
    font,
    text="BPM: 72",
    color=0xFF0000,
    scale=3,
    anchor_point=(0.5, 0.5),
    anchored_position=(120, 200)
)
splash.append(bpm_label)

# Dados O2
o2_label = label.Label(
    font,
    text="O2: 90%",
    color=0x0000FF,
    scale=3,
    anchor_point=(0.5, 0.5),
    anchored_position=(120, 40)
)
splash.append(o2_label)

# Função para criar o coração simples
def create_simple_heart():
    heart_bitmap = displayio.Bitmap(200, 36, 2)
    heart_palette = displayio.Palette(2)
    heart_palette[0] = 0x000000  # Transparente
    heart_palette[1] = 0xFF0000  # Vermelho
    heart_palette.make_transparent(0)

    # Forma simples do coração usando arrays de pixels
    heart_shape = [
        "    11      11    ",
        "  111111  111111  ",
        " 1111111111111111 ",
        "111111111111111111",
        "111111111111111111",
        "111111111111111111",
        " 1111111111111111 ",
        "  11111111111111  ",
        "   111111111111   ",
        "    1111111111    ",
        "     11111111     ",
        "      111111      ",
        "       1111       ",
        "        11        "
    ]

    # Aplica a forma ao bitmap
    for y, row in enumerate(heart_shape):
        for x, pixel in enumerate(row):
            if pixel == '1':
                heart_bitmap[x, y] = 1

    return displayio.TileGrid(heart_bitmap, pixel_shader=heart_palette, x=0, y=0)

# Cria o grupo do coração e o posiciona
heart_group = displayio.Group(scale=5)
heart = create_simple_heart()
heart_group.append(heart)

# Posiciona o grupo centralizado
heart_group.x = 80
heart_group.y = 85
splash.append(heart_group)

# Loop principal
while True:
    time.sleep(1)

