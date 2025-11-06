import os
import wifi
import socketpool
import adafruit_requests
import ssl
import digitalio
import board
import gc
from adafruit_debouncer import Button
import time
import displayio
import i2cdisplaybus
import busio
import adafruit_displayio_ssd1306
from microcontroller import reset
from adafruit_display_text import label
from adafruit_bitmap_font import bitmap_font
import adafruit_ntp
import rtc
import asyncio
import pwmio
import vectorio
from adafruit_lis3dh import LIS3DH_I2C, RANGE_8_G, STANDARD_GRAVITY

class SistemaQueda():
    def __init__(self):
        # --- Configurações padrão ---
        self.FREE_FALL_THRESHOLD = 0.6
        self.CONSECUTIVE_SAMPLES = 5
        self.SAMPLE_INTERVAL = 0.05
        
        # --- ThingSpeak Configuration ---
        self.tswriteAPI = os.getenv("thingspeak_write_api_key")
        self.API_URL = "http://api.thingspeak.com"
        
        # --- Estado do sistema ---
        self.alarme = False
        self.sample_count = 0
        self.queda_count = 1
        self.executando = True
        self.animacao_ativa = False
        self.fase_alarme = "inicial"  # "inicial", "som", "animacao"
        self.current_circle = None
        self.wifi_conectado = False
        self.ultimo_envio_thingspeak = 0
        self.intervalo_thingspeak = 15  # 15 segundos entre envios (mínimo do ThingSpeak)
        
        # --- Configuração de hardware ---
        self._inicializar_hardware()
        
        # --- Tentar conectar WiFi ---
        self._conectar_wifi()
        
        # --- Configuração NTP e RTC (se WiFi disponível) ---
        self.acertar_relogio()
        
        # --- Buzzer ---
        self.buzzer = pwmio.PWMOut(board.IO20, variable_frequency=True)
        self.buzzer.duty_cycle = 0
        
        # --- LEDs ---
        self.led_alarme = digitalio.DigitalInOut(board.IO1)
        self.led_alarme.direction = digitalio.Direction.OUTPUT
        self.led_alarme.value = False
        
        self.led_thing = digitalio.DigitalInOut(board.IO10)
        self.led_thing.direction = digitalio.Direction.OUTPUT
        self.led_thing.value = False
        
        # --- Botão (único botão para todas as funções) ---
        pin_botao = digitalio.DigitalInOut(board.IO21)
        pin_botao.direction = digitalio.Direction.INPUT
        pin_botao.pull = digitalio.Pull.UP
        self.botao = Button(pin_botao, long_duration_ms=2000)  # 2 segundos para long press
        
        # --- Grupos de display ---
        self.grupo_splash = displayio.Group()
        self.grupo_relogio = displayio.Group()
        self.grupo_alerta = displayio.Group()
        
        # --- Inicializar displays ---
        self._inicializar_splash()
        self._inicializar_relogio()
        self._inicializar_alerta()
        
        # Mostrar splash screen inicialmente
        self.display.root_group = self.grupo_splash
        
    def _inicializar_hardware(self):
        """Configura todos os componentes de hardware"""
        try:
            i2c = busio.I2C(board.SCL, board.SDA)
            
            # --- Display SSD1306 ---
            displayio.release_displays()
            display_bus = i2cdisplaybus.I2CDisplayBus(i2c, device_address=0x3C)
            self.display = adafruit_displayio_ssd1306.SSD1306(display_bus, width=128, height=64)
            self.display.root_group = None
            # --- Acelerômetro LIS3DH ---
            self.lis3dh = LIS3DH_I2C(i2c, address=0x19)
            self.lis3dh.range = RANGE_8_G
            
            print("✅ Hardware inicializado com sucesso!")            
        except Exception as e:
            print(f"❌ Erro na inicialização do hardware: {e}")
            time.sleep(2)
            reset()
            raise
    
    def acertar_relogio(self):
        # --- Configuração NTP e RTC (se WiFi disponível) ---
        if self.wifi_conectado:
            try:
                self.ntp = adafruit_ntp.NTP(self.pool, tz_offset=-3, cache_seconds=3600)
                rtc.RTC().datetime = self.ntp.datetime
                print("✅ Relógio sincronizado via NTP")
            except Exception as e:
                print(f"❌ Erro ao sincronizar relógio: {e}")
    
    def _conectar_wifi(self):
        """Tenta conectar ao WiFi"""
        try:
            ssid = os.getenv("WIFI_SSID")
            password = os.getenv("WIFI_PASSWORD")
            wifi.radio.connect(ssid, password)
            self.pool = socketpool.SocketPool(wifi.radio)
            self.requests = adafruit_requests.Session(self.pool, ssl.create_default_context())
            self.wifi_conectado = True
            print("✅ WiFi conectado!")
            print(f"📡 IP: {wifi.radio.ipv4_address}")
        except Exception as e:
            print(f"❌ WiFi não disponível: {e}")
            self.wifi_conectado = False
    
    def _inicializar_splash(self):
        """Configura a tela de splash"""
        # Limpar grupo completamente
        while len(self.grupo_splash) > 0:
            self.grupo_splash.pop()
            
        color_bitmap = displayio.Bitmap(128, 64, 1)
        color_palette = displayio.Palette(1)
        color_palette[0] = 0x000000
        bg_sprite = displayio.TileGrid(color_bitmap, pixel_shader=color_palette, x=0, y=0)
        self.grupo_splash.append(bg_sprite)
        
        self.font_splash = bitmap_font.load_font("/fonts/Helvetica-Bold-16.bdf")
        self.splash_label = label.Label(
            self.font_splash,
            text="VESTA",
            color=0xFFFFFF,
            scale=2,
            anchor_point=(0.5, 0.5),
            anchored_position=(64, 32)
        )
        self.grupo_splash.append(self.splash_label)
    
    def _inicializar_relogio(self):
        """Configura a tela do relógio"""
        # Limpar grupo completamente
        while len(self.grupo_relogio) > 0:
            self.grupo_relogio.pop()
            
        color_bitmap = displayio.Bitmap(128, 64, 1)
        color_palette = displayio.Palette(1)
        color_palette[0] = 0x000000
        bg_sprite = displayio.TileGrid(color_bitmap, pixel_shader=color_palette, x=0, y=0)
        self.grupo_relogio.append(bg_sprite)
        
        self.font_relogio = bitmap_font.load_font("/fonts/scientificaBold-11.bdf")
        self.clock_label = label.Label(
            self.font_relogio,
            text="--:--",
            color=0xFFFFFF,
            scale=4,
            anchor_point=(0.5, 0.5),
            anchored_position=(64, 32)
        )
        self.wifi_label = label.Label(
            self.font_relogio,
            text=" ",
            color=0xFFFFFF,
            scale=2,
            anchor_point=(0, 0),
            anchored_position=(116, 0)
        )
        self.grupo_relogio.append(self.clock_label)
        self.grupo_relogio.append(self.wifi_label)
        self.wifi_label.text = '▲' if self.wifi_conectado else ' '
    
    def _inicializar_alerta(self):
        """Configura a tela de alerta de queda"""
        # Limpar grupo completamente
        while len(self.grupo_alerta) > 0:
            self.grupo_alerta.pop()
            
        self.alerta_bitmap = displayio.Bitmap(128, 64, 1)
        self.alerta_palette = displayio.Palette(1)
        self.alerta_palette[0] = 0x000000
        bg_sprite = displayio.TileGrid(self.alerta_bitmap, pixel_shader=self.alerta_palette, x=0, y=0)
        self.grupo_alerta.append(bg_sprite)
        
        self.circle_group = displayio.Group()
        self.grupo_alerta.append(self.circle_group)
        
        self.font_alerta = bitmap_font.load_font("/fonts/Helvetica-Bold-16.bdf")
        self.alert_label = label.Label(
            self.font_alerta,
            text="QUEDA!",
            color=0xFFFFFF,
            scale=2,
            anchor_point=(0.5, 0.5),
            anchored_position=(64, 32)
        )
        self.grupo_alerta.append(self.alert_label)
        
        self.circle_palette = displayio.Palette(1)
        self.circle_palette[0] = 0xFFFFFF
        self.current_circle = None
        self.is_red = True
    
    async def mostrar_splash(self):
        """Mostra a splash screen por 3 segundos"""
        await asyncio.sleep(3)
        self.display.root_group = self.grupo_relogio
    
    async def tocar_sirene(self, duracao=3):
        """Toca a sirene por 3 segundos"""
        self.buzzer.duty_cycle = 2**15
        inicio = time.monotonic()
        
        while time.monotonic() - inicio < duracao and self.alarme:
            for hz in range(400, 1000, 25):
                if not self.alarme or time.monotonic() - inicio >= duracao:
                    break
                self.buzzer.frequency = hz
                await asyncio.sleep(0.0075)
            
            for hz in range(1000, 400, -25):
                if not self.alarme or time.monotonic() - inicio >= duracao:
                    break
                self.buzzer.frequency = hz
                await asyncio.sleep(0.0075)
        
        self.buzzer.duty_cycle = 0
    
    async def monitorar_botao(self):
        """Monitora o botão para todas as funções"""
        while True:
            self.botao.update()
            
            # Long press para ativar/desativar alarme
            if self.botao.long_press:
                if not self.alarme:
                    # Ativar alarme manualmente
                    self.alarme = True
                    self.fase_alarme = "som"
                    self.display.root_group = self.grupo_alerta
                    print("🔔 Alarme ativado manualmente via botão")
                else:
                    # Desativar alarme
                    self.alarme = False
                    self.led_alarme.value = False
                    self.buzzer.duty_cycle = 0
                    self.animacao_ativa = False
                    self.fase_alarme = "inicial"
                    self.display.root_group = self.grupo_relogio
                    print("🔕 Alarme desativado via botão")
            
            # Press curto para feedback (apenas se não for long press)
            elif self.botao.short_count > 0:
                await self.tocar_ton(523, 0.1)  # Feedback sonoro
                
            await asyncio.sleep(0.01)

    async def tocar_ton(self, frequencia, duracao):
        """Toca um tom específico usando PWM"""
        self.buzzer.frequency = frequencia
        self.buzzer.duty_cycle = 2**15
        await asyncio.sleep(duracao)
        self.buzzer.duty_cycle = 0
        await asyncio.sleep(0.1)

    async def controlar_alarme(self):
        """Controla a sequência do alarme: sirene por 3s, depois animação"""
        while True:
            if self.alarme and self.fase_alarme == "som":
                print("🔊 Iniciando fase de sirene do alarme")
                self.led_alarme.value = True
                await self.tocar_sirene(3)
                
                if self.alarme:
                    self.fase_alarme = "animacao"
                    self.animacao_ativa = True
                    print("🎬 Iniciando fase de animação do alarme")
                
            await asyncio.sleep(0.01)

    async def piscar_led_alarme(self, intervalo_segundos=0.5):
        """Controla o pisca-pisca do LED baseado no estado do alarme"""
        led_estado = False
        ultimo_tempo = time.monotonic()
        
        while self.executando:
            tempo_atual = time.monotonic()        
            if self.alarme and self.fase_alarme == "animacao":
                if tempo_atual - ultimo_tempo >= intervalo_segundos:
                    led_estado = not led_estado
                    self.led_alarme.value = led_estado
                    ultimo_tempo = tempo_atual
            elif not self.alarme:
                if led_estado:
                    led_estado = False
                    self.led_alarme.value = False
                    
            await asyncio.sleep(0.01)
    
    async def animar_alerta(self):
        """Animação do alerta no display"""
        while True:
            if self.animacao_ativa and self.alarme:
                for radius in range(5, 64, 2):
                    if not self.animacao_ativa or not self.alarme:
                        break
                        
                    if self.current_circle:
                        self.circle_group.remove(self.current_circle)
                    
                    self.current_circle = vectorio.Circle(
                        pixel_shader=self.circle_palette, 
                        radius=radius, 
                        x=64, 
                        y=32
                    )
                    self.circle_group.append(self.current_circle)
                    
                    if self.is_red:
                        self.alert_label.color = 0x000000
                    else:
                        self.alert_label.color = 0xFFFFFF
                    self.is_red = not self.is_red
                    
                    await asyncio.sleep(0.01)
                
                if self.current_circle:
                    self.circle_group.remove(self.current_circle)
                    self.current_circle = None
                
                await asyncio.sleep(0.01)
            else:
                await asyncio.sleep(0.01)

    async def relogio(self):
        """Exibe e atualiza o relógio no display"""
        await asyncio.sleep(3)
        
        while True:
            if not self.alarme:
                self.now = time.localtime()
                if self.now.tm_sec % 2:
                    current_time = "{:02}.{:02}".format(self.now.tm_hour, self.now.tm_min)
                else:
                    current_time = "{:02}'{:02}".format(self.now.tm_hour, self.now.tm_min)
                self.clock_label.text = current_time
            
            await asyncio.sleep(0.01)

    async def detectar_queda(self):
        """Detecta quedas usando o acelerômetro LIS3DH"""
        while True:
            try:
                # Ler valores do acelerômetro
                x, y, z = [value / STANDARD_GRAVITY for value in self.lis3dh.acceleration]
                
                # Calcular a aceleração total (em G)
                accel_total =  (x**2 + y**2 + z**2)**0.5
                
                # Verificar se está em queda livre
                if accel_total < self.FREE_FALL_THRESHOLD:  
                    self.sample_count += 1
                    print(f'amostra: {self.sample_count} - {accel_total:.2f}')
                    if self.sample_count >= self.CONSECUTIVE_SAMPLES:
                        if not self.alarme:
                            print(f"🚨 QUEDA DETECTADA! Aceleração: {accel_total:.2f}G")
                            self.alarme = True
                            self.fase_alarme = "som"
                            self.display.root_group = self.grupo_alerta
                            self.queda_count += 1
                else:
                    self.sample_count = 0
                
                await asyncio.sleep(self.SAMPLE_INTERVAL)
                
            except Exception as e:
                print(f"Erro na detecção de queda: {e}")
                await asyncio.sleep(1)

    async def enviar_dados_thingspeak(self):
        """Envia dados periódicos do acelerômetro e estado do alarme para o ThingSpeak"""
        while True:
            try:
                # Verificar se é hora de enviar
                tempo_atual = time.monotonic()
                if tempo_atual - self.ultimo_envio_thingspeak >= self.intervalo_thingspeak:
                    
                    if self.wifi_conectado:
                        # Tentar reconectar se necessário
                        if not wifi.radio.ipv4_address or "0.0.0.0" in repr(wifi.radio.ipv4_address):
                            self._conectar_wifi()
                        
                        if self.wifi_conectado:
                            # Ler dados do acelerômetro
                            x, y, z = (value / STANDARD_GRAVITY for value in self.lis3dh.acceleration)
                            
                            # Preparar field4: 1 se alarme ativo, 0 se inativo
                            field4 = 1 if self.alarme else 0
                            
                            # Enviar para ThingSpeak (todos os campos juntos)
                            get_url = f"{self.API_URL}/update?api_key={self.tswriteAPI}&field1={x:.2f}&field2={y:.2f}&field3={z:.2f}&field4={field4}"
                            
                            try:
                                r = self.requests.get(get_url)
                                print(f"📡 Dados enviados - X: {x:.2f}G, Y: {y:.2f}G, Z: {z:.2f}G, Alarme: {field4}")
                                print(f"📋 Contador: {r.text}")
                                
                                # Feedback visual - piscar o LED de envio
                                for _ in range(3):  # Piscar 3 vezes rapidamente
                                    self.led_thing.value = True
                                    await asyncio.sleep(0.1)
                                    self.led_thing.value = False
                                    await asyncio.sleep(0.1)
                                
                                self.ultimo_envio_thingspeak = tempo_atual
                                
                            except Exception as e:
                                print(f"❌ Erro ao enviar para ThingSpeak: {e}")
                                self.wifi_conectado = False
                    
                    print(f"🧠 Memória: livre={gc.mem_free()} alocada={gc.mem_alloc()}")
                
                await asyncio.sleep(3)
                
            except Exception as e:
                print(f"❌ Erro geral no ThingSpeak: {e}")
                await asyncio.sleep(5)

    async def verificar_wifi(self):
        """Verifica periodicamente a conexão WiFi"""
        while True:
            try:
                if not self.wifi_conectado:
                    self._conectar_wifi()
                    self.acertar_relogio()
                    self.wifi_label.text = ' '
                elif not wifi.radio.ipv4_address or "0.0.0.0" in repr(wifi.radio.ipv4_address):
                    print("⚠️ Conexão WiFi perdida")
                    self.wifi_conectado = False
                    self.wifi_label.text = ' '
                else:
                    self.wifi_label.text = '▲'
                    
            except Exception as e:
                self.wifi_conectado = False
                self.wifi_label.text = ' '
                
            await asyncio.sleep(30)  # Verificar a cada 30 segundos

async def main():
    sistema = SistemaAlarme()
    tasks = [
        asyncio.create_task(sistema.mostrar_splash()),
        asyncio.create_task(sistema.monitorar_botao()),
        asyncio.create_task(sistema.controlar_alarme()),
        asyncio.create_task(sistema.piscar_led_alarme()),
        asyncio.create_task(sistema.relogio()),
        asyncio.create_task(sistema.animar_alerta()),
        asyncio.create_task(sistema.detectar_queda()),
        asyncio.create_task(sistema.enviar_dados_thingspeak()),
        asyncio.create_task(sistema.verificar_wifi()),
    ]
    await asyncio.gather(*tasks)

if __name__ == "__main__" or __name__ == 'sprint2':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("👋 Programa interrompido pelo usuário")
    except Exception as e:
        print(f"💀 Erro fatal: {e}")
        time.sleep(3)
        reset()
