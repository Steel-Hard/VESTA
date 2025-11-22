import os
import wifi
import socketpool
import digitalio
import board
import gc
import time
import displayio
import i2cdisplaybus
import busio
from microcontroller import reset
from adafruit_display_text import label
from adafruit_bitmap_font import bitmap_font
import adafruit_ntp
import rtc
import asyncio
import pwmio
import adafruit_minimqtt.adafruit_minimqtt as MQTT
import adafruit_lis3dh
from adafruit_lis3dh import LIS3DH_I2C, RANGE_8_G, STANDARD_GRAVITY
import json
from fourwire import FourWire
import vectorio

# Liberar memória imediatamente
gc.collect()

class GerenciadorHardware:
    def __init__(self, display_type='GC9A01A'):
        self.display_type = display_type
        self.tft_bkl = None
        self.lis3dh = None
        self.buzzer = None
        self.display = None

        # Configurações de pinos
        self.TFT_CS = board.IO7
        self.TFT_DC = board.IO10
        self.TFT_RST = board.IO3
        self.TFT_BKL_PIN = board.IO0
        self.BUZZER_PIN = board.IO2
        self.SSD1306_ADDRESS = 0x3C
        self.ACELEROMETRO_ADDRESS = 0x19
        self.SCL = board.SCL
        self.SDA = board.SDA

        self._inicializar_hardware()

    def _inicializar_hardware(self):
        """Configura todos os componentes de hardware"""
        try:
            i2c = busio.I2C(self.SCL, self.SDA)

            # Display - inicialmente com backlight desligado
            if self.display_type == 'SSD1306':
                import adafruit_displayio_ssd1306
                displayio.release_displays()
                display_bus = i2cdisplaybus.I2CDisplayBus(i2c, device_address=self.SSD1306_ADDRESS)
                self.display = adafruit_displayio_ssd1306.SSD1306(display_bus, width=128, height=64)
            else:  # GC9A01A
                displayio.release_displays()
                import adafruit_gc9a01a
                self.tft_bkl = digitalio.DigitalInOut(self.TFT_BKL_PIN)
                self.tft_bkl.direction = digitalio.Direction.OUTPUT
                self.tft_bkl.value = False  # Backlight desligado inicialmente
                spi = board.SPI()
                display_bus = FourWire(spi, command=self.TFT_DC, chip_select=self.TFT_CS, reset=self.TFT_RST)
                self.display = adafruit_gc9a01a.GC9A01A(display_bus, width=240, height=240)

            # Acelerômetro
            INT_PIN = board.IO1
            int1 = digitalio.DigitalInOut(INT_PIN)
            int1.direction = digitalio.Direction.INPUT
            int1.pull = digitalio.Pull.UP
            
            self.lis3dh = LIS3DH_I2C(i2c, address=self.ACELEROMETRO_ADDRESS, int1=int1)
            self.lis3dh.range = RANGE_8_G
            
            # Configurar detecção de tap duplo SIMPLES
            self.lis3dh.set_tap(2, 60)  # 2 taps, threshold=60

            # Buzzer
            self.buzzer = pwmio.PWMOut(self.BUZZER_PIN, variable_frequency=True)
            self.buzzer.duty_cycle = 0

            print("Hardware inicializado com sucesso!")

        except Exception as e:
            print(f"Erro na inicializacao do hardware: {e}")
            raise

    def verificar_tap_duplo(self):
        """Verifica se ocorreu um tap duplo - SIMPLES"""
        try:
            if self.lis3dh.tapped:
                return True
            return False
        except Exception as e:
            return False

    def controlar_backlight(self, estado):
        """Controla a luz de fundo do display"""
        if self.tft_bkl:
            self.tft_bkl.value = estado

    def ler_aceleracao(self):
        """Lê os valores de aceleração"""
        try:
            x, y, z = [value / STANDARD_GRAVITY for value in self.lis3dh.acceleration]
            return x, y, z
        except Exception as e:
            print(f"Erro ao ler aceleracao: {e}")
            return 0, 0, 0

    def tocar_frequencia(self, frequencia, duty_cycle=32768):
        """Toca uma frequência específica no buzzer"""
        self.buzzer.frequency = frequencia
        self.buzzer.duty_cycle = duty_cycle

    def silenciar_buzzer(self):
        """Silencia o buzzer"""
        self.buzzer.duty_cycle = 0


class GerenciadorDisplay:
    def __init__(self, hardware, display_type):
        self.hardware = hardware
        self.display_type = display_type
        self.display_ligado = False  # Inicialmente desligado
        self.ultima_atividade = time.monotonic()
        self.tempo_timeout = 30  # 30 segundos para desligar

        # Grupos de display
        self.grupo_splash = displayio.Group()
        self.grupo_relogio = displayio.Group()
        self.grupo_alerta = displayio.Group()
        self.circle_group = displayio.Group()
        self.current_circle = None

        # Labels
        self.clock_label = None
        self.wifi_label = None
        self.alert_label = None

        self._inicializar_telas()

    def _inicializar_telas(self):
        """Inicializa todas as telas do display"""
        self._inicializar_splash()
        self._inicializar_relogio()
        self._inicializar_alerta()

    def _inicializar_splash(self):
        """Configura tela de splash"""
        while self.grupo_splash:
            self.grupo_splash.pop()

        self.hardware.controlar_backlight(True)

        if self.display_type == 'GC9A01A':
            try:
                bitmap = displayio.OnDiskBitmap(open("logo.bmp", "rb"))
                image = displayio.TileGrid(
                                    bitmap,
                                    pixel_shader=bitmap.pixel_shader
                                    )
                self.grupo_splash.append(image)
            except:
                if self.display_type == 'SSD1306':
                    x_pos, y_pos = (64, 32)
                else:
                    x_pos, y_pos = (120, 120)
                splash_label = label.Label(
                                    None,
                                    text="VESTA",
                                    color=0xFFFFFF,
                                    scale=2,
                                    anchor_point=(0.5, 0.5),
                                    anchored_position=(x_pos, y_pos)
                                    )
                self.grupo_splash.append(splash_label)
        else:  # SSD1306
            color_bitmap = displayio.Bitmap(128, 64, 1)
            color_palette = displayio.Palette(1)
            color_palette[0] = 0x000000
            bg_sprite = displayio.TileGrid(color_bitmap, pixel_shader=color_palette, x=0, y=0)
            self.grupo_splash.append(bg_sprite)

            try:
                font = bitmap_font.load_font("/fonts/Helvetica-Bold-16.bdf")
                splash_label = label.Label(
                    font,
                    text="VESTA",
                    color=0xFFFFFF,
                    scale=2,
                    anchor_point=(0.5, 0.5),
                    anchored_position=(64, 32)
                )
            except:
                splash_label = label.Label(
                    None,
                    text="VESTA",
                    color=0xFFFFFF,
                    scale=2,
                    anchor_point=(0.5, 0.5),
                    anchored_position=(64, 32)
                )
            self.grupo_splash.append(splash_label)

    def _inicializar_relogio(self):
        """Configura tela do relógio"""
        # Bitmap de fundo
        if self.display_type == 'SSD1306':
            width, height = (128, 64)
            x_pos, y_pos = (64, 32)
            x_wifi, y_wifi = (116, 0)
        else:
            width, height = (240, 240)
            x_pos, y_pos = (120, 120)
            x_wifi, y_wifi = (120, 40)

        color_bitmap = displayio.Bitmap(width, height, 1)
        color_palette = displayio.Palette(1)
        color_palette[0] = 0x000000
        bg_sprite = displayio.TileGrid(color_bitmap, pixel_shader=color_palette, x=0, y=0)
        self.grupo_relogio.append(bg_sprite)

        # Label do relógio
        try:
            font = bitmap_font.load_font("/fonts/scientificaBold-11.bdf")
            self.clock_label = label.Label(font, text="--:--", color=0xFFFFFF,
                                         scale=7 if self.display_type == 'GC9A01A' else 4,
                                         anchor_point=(0.5, 0.5), anchored_position=(x_pos, y_pos))
        except:
            self.clock_label = label.Label(None, text="--:--", color=0xFFFFFF, scale=4,
                                         anchor_point=(0.5, 0.5), anchored_position=(x_pos, y_pos))

        # Label WiFi - AGORA SEMPRE VISÍVEL
        try:
            font_wifi = bitmap_font.load_font("/fonts/scientificaBold-11.bdf")
            self.wifi_label = label.Label(font_wifi, text="C", color=0xFFFF00, scale=2,
                                        anchor_point=(1, 0), anchored_position=(x_wifi, y_wifi))
        except:
            self.wifi_label = label.Label(None, text="", color=0xFFFF00, scale=2,
                                        anchor_point=(1, 0), anchored_position=(x_wifi, y_wifi))

        self.grupo_relogio.append(self.clock_label)
        self.grupo_relogio.append(self.wifi_label)

    def _inicializar_alerta(self):
        """Configura tela de alerta"""
        if self.display_type == 'SSD1306':
            width, height = (128, 64)
            x_pos, y_pos = (64, 32)
        else:
            width, height = (240, 240)
            x_pos, y_pos = (120, 120)

        color_bitmap = displayio.Bitmap(width, height, 1)
        color_palette = displayio.Palette(1)
        color_palette[0] = 0x000000
        bg_sprite = displayio.TileGrid(color_bitmap, pixel_shader=color_palette, x=0, y=0)
        self.grupo_alerta.append(bg_sprite)

        # Label de alerta
        try:
            font = bitmap_font.load_font("/fonts/Helvetica-Bold-16.bdf")
            self.alert_label = label.Label(font, text="QUEDA!", color=0x000000, scale=3,
                                         anchor_point=(0.5, 0.5), anchored_position=(x_pos, y_pos))
        except:
            self.alert_label = label.Label(None, text="QUEDA!", color=0xFF0000, scale=3,
                                         anchor_point=(0.5, 0.5), anchored_position=(x_pos, y_pos))


        self.grupo_alerta.append(self.circle_group)
        self.grupo_alerta.append(self.alert_label)

    def mostrar_tela(self, tela):
        """Alterna entre telas"""
        telas = {
            'splash': self.grupo_splash,
            'relogio': self.grupo_relogio,
            'alerta': self.grupo_alerta
        }

        if tela in telas:
            self.hardware.display.root_group = telas[tela]
            if tela == 'splash' or tela == 'relogio' or tela == 'alerta':
                self.hardware.controlar_backlight(True)
                self.display_ligado = True
                self.ultima_atividade = time.monotonic()

    def desligar_display(self):
        """Desliga o display"""
        self.hardware.display.root_group = None
        self.hardware.controlar_backlight(False)
        self.display_ligado = False

    def atualizar_relogio(self, hora_str):
        """Atualiza o texto do relógio"""
        if self.clock_label:
            self.clock_label.text = hora_str

    def atualizar_wifi_status(self, conectado):
        """Atualiza indicador de WiFi - AGORA FUNCIONANDO"""
        if self.wifi_label:
            self.wifi_label.text = 'C' if conectado else ''

    def ligar_display(self):
        """Liga o display e reinicia o timer de atividade"""
        if not self.display_ligado:
            self.mostrar_tela('relogio')
            self.ultima_atividade = time.monotonic()
            return True
        return False

    def desligar_display_por_timeout(self):
        """Desliga o display se passou o tempo limite"""
        if (self.display_ligado and 
            time.monotonic() - self.ultima_atividade > self.tempo_timeout):
            self.desligar_display()
            return True
        return False

    def limpar_splash(self):
        """Limpa a tela de splash para liberar memória"""
        while len(self.grupo_splash) > 0:
            self.grupo_splash.pop()
        gc.collect()

    async def animar_alerta(self):
        """Executa animação de alerta - CORRIGIDA"""
        circle_palette = displayio.Palette(1)
        circle_palette[0] = 0xFFFFFF  # Círculos brancos

        start_time = time.monotonic()
        
        # Animação por 5 segundos
        while time.monotonic() - start_time < 5:
            for radius in range(5, 110, 5):
                if self.current_circle:
                    self.circle_group.remove(self.current_circle)
                
                self.current_circle = vectorio.Circle(pixel_shader=circle_palette, 
                                                    radius=radius, x=120, y=120)
                self.circle_group.append(self.current_circle)
                
                # Alternar entre VERMELHO e BRANCO (não preto)
                if radius % 10 == 0:  # Alternar a cada 10 pixels
                    self.alert_label.color = 0x000000  # Branco
                else:
                    self.alert_label.color = 0xFF0000  # Vermelho
                
                await asyncio.sleep(0.01)  # Mais rápido
            
            if self.current_circle:
                self.circle_group.remove(self.current_circle)
                self.current_circle = None
            
            await asyncio.sleep(0.01)


class DetectorQuedas:
    def __init__(self, hardware, limiar_queda_livre=0.6, limiar_impacto=2, 
                 amostras_consecutivas=3, intervalo_amostragem=0.05):
        self.hardware = hardware
        self.FREE_FALL_THRESHOLD = limiar_queda_livre
        self.IMPACT_THRESHOLD = limiar_impacto
        self.CONSECUTIVE_SAMPLES = amostras_consecutivas
        self.SAMPLE_INTERVAL = intervalo_amostragem

        self.sample_count = 0
        self.em_queda_livre = False

    async def monitorar_quedas(self):
        """Monitora continuamente por quedas"""
        while True:
            try:
                x, y, z = self.hardware.ler_aceleracao()
                accel_total = (x**2 + y**2 + z**2)**0.5

                if not self.em_queda_livre:
                    if accel_total < self.FREE_FALL_THRESHOLD:
                        self.sample_count += 1
                        if self.sample_count >= self.CONSECUTIVE_SAMPLES:
                            self.em_queda_livre = True
                            print(f"Queda livre detectada: {accel_total:.2f}g")
                    else:
                        self.sample_count = 0
                else:
                    if accel_total > self.IMPACT_THRESHOLD:
                        print(f"Impacto detectado: {accel_total:.2f}g")
                        self.em_queda_livre = False
                        self.sample_count = 0
                        return True

                    elif accel_total > (self.FREE_FALL_THRESHOLD + 0.3):
                        print("Falso positivo - resetando")
                        self.em_queda_livre = False
                        self.sample_count = 0

                await asyncio.sleep(self.SAMPLE_INTERVAL)

            except Exception as e:
                print(f"Erro na deteccao de queda: {e}")
                await asyncio.sleep(1)

    def atualizar_parametros(self, config):
        """Atualiza parâmetros de detecção"""
        if "FREE_FALL_THRESHOLD" in config:
            self.FREE_FALL_THRESHOLD = float(config["FREE_FALL_THRESHOLD"])
            print(f"FREE_FALL_THRESHOLD atualizado para: {self.FREE_FALL_THRESHOLD}")
        if "IMPACT_THRESHOLD" in config:
            self.IMPACT_THRESHOLD = float(config["IMPACT_THRESHOLD"])
            print(f"IMPACT_THRESHOLD atualizado para: {self.IMPACT_THRESHOLD}")
        if "CONSECUTIVE_SAMPLES" in config:
            self.CONSECUTIVE_SAMPLES = int(config["CONSECUTIVE_SAMPLES"])
            print(f"CONSECUTIVE_SAMPLES atualizado para: {self.CONSECUTIVE_SAMPLES}")
        if "SAMPLE_INTERVAL" in config:
            self.SAMPLE_INTERVAL = float(config["SAMPLE_INTERVAL"])
            print(f"SAMPLE_INTERVAL atualizado para: {self.SAMPLE_INTERVAL}")


class GerenciadorRede:
    def __init__(self, email, senha):
        self.EMAIL = email
        self.SENHA = senha

        self.wifi_conectado = False
        self._mqtt_conectado = False
        self.pool = None
        self.mqtt_client = None

        self._conectar_wifi()

    def _conectar_wifi(self):
        """Tenta conectar ao WiFi"""
        try:
            ssid = os.getenv("WIFI_SSID")
            password = os.getenv("WIFI_PASSWORD")
            wifi.radio.connect(ssid, password)
            self.pool = socketpool.SocketPool(wifi.radio)
            self.wifi_conectado = True
            print("WiFi conectado!")
            
            # Chamar callback imediatamente após conectar
            if hasattr(self, 'callback_wifi'):
                self.callback_wifi(True)
                
            gc.collect()
        except Exception as e:
            print(f"WiFi nao disponivel: {e}")
            self.wifi_conectado = False

    def _conectar_mqtt(self):
        """Conecta MQTT apenas quando necessário"""
        if not self.wifi_conectado or self._mqtt_conectado:
            return True

        try:
            self.mqtt_client = MQTT.MQTT(
                broker="maqiatto.com",
                port=1883,
                username=self.EMAIL,
                password=self.SENHA,
                socket_pool=self.pool,
                socket_timeout=0.4,
                keep_alive=30,
            )

            self.mqtt_client.on_connect = self._on_mqtt_connect
            self.mqtt_client.on_message = self._on_mqtt_message
            self.mqtt_client.on_disconnect = self._on_mqtt_disconnect
            self.mqtt_client.connect()
            self._mqtt_conectado = True
            print("MQTT conectado!")
            return True

        except Exception as e:
            print(f"Erro ao conectar MQTT: {e}")
            self._mqtt_conectado = False
            return False

    def _desconectar_mqtt(self):
        """Desconecta MQTT para liberar memória"""
        if self.mqtt_client and self._mqtt_conectado:
            try:
                self.mqtt_client.disconnect()
                self.mqtt_client = None
                self._mqtt_conectado = False
                gc.collect()
            except Exception as e:
                print(f"Erro ao desconectar MQTT: {e}")

    def _on_mqtt_connect(self, client, userdata, flags, rc):
        """Callback quando o MQTT se conecta"""
        print(f"=== MQTT CONECTADO ===")
        topico = f"{self.EMAIL}/settings"
        client.subscribe(topico)
        print(f"Inscrito no topico: {topico}")

    def _on_mqtt_disconnect(self, client, userdata, rc):
        """Callback quando o MQTT desconecta"""
        print("=== MQTT DESCONECTADO ===")
        self._mqtt_conectado = False

    def _on_mqtt_message(self, client, topic, message):
        """Callback quando uma mensagem chega"""
        try:
            msg_str = message.decode() if isinstance(message, bytes) else str(message)
            if topic == f"{self.EMAIL}/settings":
                self.processar_configuracoes(msg_str)
        except Exception as e:
            print(f"Erro ao processar mensagem MQTT: {e}")

    def processar_configuracoes(self, mensagem):
        """Processa as configuracoes recebidas via MQTT"""
        print(f"Processando configuracoes: {mensagem}")
        try:
            mensagem_limpa = mensagem.strip()
            if mensagem_limpa.startswith('{') and mensagem_limpa.endswith('}'):
                conteudo = mensagem_limpa[1:-1]
                pares = conteudo.split(',')

                config = {}
                for par in pares:
                    if ':' in par:
                        partes = par.split(':', 1)
                        if len(partes) == 2:
                            chave, valor = partes
                            chave = chave.strip().replace('"', '').replace("'", "")
                            valor = valor.strip()

                            try:
                                if '.' in valor:
                                    config[chave] = float(valor)
                                else:
                                    config[chave] = int(valor)
                            except ValueError:
                                config[chave] = valor

                if hasattr(self, 'callback_configuracao'):
                    self.callback_configuracao(config)

        except Exception as e:
            print(f"Erro ao processar configuracoes: {e}")

    def registrar_callback_configuracao(self, callback):
        """Registra callback para configurações MQTT"""
        self.callback_configuracao = callback

    async def manter_conexao_mqtt(self):
        """Tarefa MQTT com timeout ajustado"""
        while True:
            if self.wifi_conectado:
                try:
                    if not self._mqtt_conectado:
                        self._conectar_mqtt()
                    else:
                        self.mqtt_client.loop(0.4)
                except Exception as e:
                    print(f"Erro no loop MQTT: {e}")
                    self._mqtt_conectado = False
            await asyncio.sleep(1)

    def publicar_mqtt(self, topico, mensagem):
        """Publica uma mensagem MQTT"""
        if not self._mqtt_conectado:
            if not self._conectar_mqtt():
                return False

        try:
            self.mqtt_client.publish(topico, mensagem, qos=0)
            print(f"Mensagem MQTT publicada: {topico}")
            return True
        except Exception as e:
            print(f"Erro ao publicar MQTT: {e}")
            self._mqtt_conectado = False
            return False

    async def enviar_notificacao_queda(self, dados_aceleracao):
        """Envia notificação de queda para backend via MQTT"""
        if not self.wifi_conectado:
            return False

        print("=== INICIANDO ENVIO DE ALARME ===")

        # Preparar payload
        payload = {
            "x": round(dados_aceleracao[0], 2),
            "y": round(dados_aceleracao[1], 2),
            "z": round(dados_aceleracao[2], 2),
            "fall": True
        }

        # Enviar via MQTT
        topico_mqtt = f"{self.EMAIL}/queda"
        sucesso_mqtt = self.publicar_mqtt(topico_mqtt, json.dumps(payload))

        if sucesso_mqtt:
            print("✅ Alarme enviado com sucesso!")
        else:
            print("❌ Falha ao enviar alarme")

        gc.collect()
        print("=== FIM DO ENVIO DE ALARME ===")

        return sucesso_mqtt

    async def verificar_conexao(self):
        """Verifica periodicamente a conexão WiFi"""
        while True:
            try:
                if not self.wifi_conectado:
                    self._conectar_wifi()
                elif not wifi.radio.ipv4_address:
                    print("Conexao WiFi perdida")
                    self.wifi_conectado = False
                    if hasattr(self, 'callback_wifi'):
                        self.callback_wifi(False)
            except Exception as e:
                self.wifi_conectado = False
                if hasattr(self, 'callback_wifi'):
                    self.callback_wifi(False)
            
            await asyncio.sleep(10)

    def registrar_callback_wifi(self, callback):
        """Registra callback para status WiFi"""
        self.callback_wifi = callback


class GerenciadorAlarme:
    def __init__(self, hardware, display, detector_quedas, rede):
        self.hardware = hardware
        self.display = display
        self.detector_quedas = detector_quedas
        self.rede = rede

        self.alarme_ativado = False
        self.sirene_ativa = False
        self.animacao_ativa = False
        self.ultima_queda_detectada = 0
        self.intervalo_minimo_queda = 5

    async def ativar_alarme_manual(self):
        """Ativa o alarme manualmente (para teste com tap duplo)"""
        if not self.alarme_ativado:
            self.alarme_ativado = True
            self.display.mostrar_tela('alerta')
            print("Alarme ativado manualmente via tap duplo")

            # Enviar notificação
            x, y, z = self.hardware.ler_aceleracao()
            await self.rede.enviar_notificacao_queda((x, y, z))

    async def processar_queda_detectada(self):
        """Processa uma queda detectada"""
        agora = time.monotonic()
        if agora - self.ultima_queda_detectada >= self.intervalo_minimo_queda:
            self.ultima_queda_detectada = agora
            self.alarme_ativado = True
            self.display.mostrar_tela('alerta')
            print("QUEDA DETECTADA! Ativando alarme...")
            
            # Enviar notificação
            x, y, z = self.hardware.ler_aceleracao()
            await self.rede.enviar_notificacao_queda((x, y, z))

    async def tocar_sirene(self):
        """Toca a sirene do alarme"""
        self.sirene_ativa = True
        self.hardware.buzzer.duty_cycle = 2**15
        inicio = time.monotonic()

        while time.monotonic() - inicio < 3 and self.alarme_ativado:
            for hz in range(400, 1000, 25):
                if not self.alarme_ativado:
                    break
                self.hardware.tocar_frequencia(hz)
                await asyncio.sleep(0.0075)

            for hz in range(1000, 400, -25):
                if not self.alarme_ativado:
                    break
                self.hardware.tocar_frequencia(hz)
                await asyncio.sleep(0.0075)

        self.hardware.silenciar_buzzer()
        self.sirene_ativa = False

    def desativar_alarme(self):
        """Desativa o alarme"""
        self.alarme_ativado = False
        self.animacao_ativa = False
        self.hardware.silenciar_buzzer()
        self.display.mostrar_tela('relogio')
        print("Alarme desativado")

    async def controlar_alarme(self):
        """Controla a sequência completa do alarme"""
        while True:
            if self.alarme_ativado and not self.sirene_ativa:
                await self.tocar_sirene()
                if self.alarme_ativado:
                    self.animacao_ativa = True
                    
            await asyncio.sleep(0.1)


class ControladorAcelerometro:
    def __init__(self, hardware, gerenciador_alarme, limiar_y=0.8):
        self.hardware = hardware
        self.alarme = gerenciador_alarme
        self.LIMIAR_Y = limiar_y

    async def monitorar_acelerometro(self):
        """Monitora continuamente o acelerômetro para orientação e tap duplo"""
        while True:
            try:
                # Verificar tap duplo - SIMPLES
                if self.hardware.verificar_tap_duplo():
                    print("Tap duplo detectado! Ativando alarme manual...")
                    await self.alarme.ativar_alarme_manual()

                # Verificar orientação para ligar display (Y > 0.8G)
                x, y, z = self.hardware.ler_aceleracao()
                if abs(y) > self.LIMIAR_Y and not self.alarme.display.display_ligado:
                    self.alarme.display.ligar_display()
                    print(f"Orientacao detectada (Y: {y:.2f}G), ligando display")

                # Verificar timeout do display
                self.alarme.display.desligar_display_por_timeout()

                await asyncio.sleep(0.1)

            except Exception as e:
                print(f"Erro no monitoramento do acelerometro: {e}")
                await asyncio.sleep(1)


class SistemaRelogio:
    def __init__(self, gerenciador_rede, gerenciador_display):
        self.rede = gerenciador_rede
        self.display = gerenciador_display
        self.ultima_atualizacao = 0
        self.segundo_par = False

    async def sincronizar_horario(self):
        """Sincroniza o relógio via NTP"""
        if self.rede.wifi_conectado:
            try:
                ntp = adafruit_ntp.NTP(self.rede.pool, tz_offset=-3)
                rtc.RTC().datetime = ntp.datetime
                print("Relogio sincronizado via NTP")
                ntp = None
                gc.collect()
            except Exception as e:
                print(f"Erro ao sincronizar relogio: {e}")

    async def atualizar_display_horario(self):
        """Atualiza continuamente o horário no display com : piscando"""
        while True:
            if not self.display.display_ligado or self.display.hardware.display.root_group == self.display.grupo_alerta:
                await asyncio.sleep(0.1)
                continue

            tempo_atual = time.monotonic()
            if tempo_atual - self.ultima_atualizacao >= 1.0:
                now = time.localtime()
                
                if self.segundo_par:
                    hora_formatada = "{:02}:{:02}".format(now.tm_hour, now.tm_min)
                else:
                    hora_formatada = "{:02} {:02}".format(now.tm_hour, now.tm_min)
                
                self.segundo_par = not self.segundo_par
                self.display.atualizar_relogio(hora_formatada)
                self.ultima_atualizacao = tempo_atual

            await asyncio.sleep(0.1)


class SistemaAlarme:
    def __init__(self, id_dispositivo, display_type='GC9A01A'):
        self.id_dispositivo = id_dispositivo

        # Inicializar componentes
        self.hardware = GerenciadorHardware(display_type)
        self.display = GerenciadorDisplay(self.hardware, display_type)
        self.rede = GerenciadorRede(
            email="x4cajh8pu@mozmail.com",
            senha="123"
        )
        self.detector_quedas = DetectorQuedas(self.hardware)
        self.alarme = GerenciadorAlarme(self.hardware, self.display, self.detector_quedas, self.rede)
        self.acelerometro = ControladorAcelerometro(self.hardware, self.alarme)
        self.relogio = SistemaRelogio(self.rede, self.display)

        # Registrar callbacks
        self.rede.registrar_callback_configuracao(self.atualizar_configuracoes)
        self.rede.registrar_callback_wifi(self.display.atualizar_wifi_status)

        gc.collect()
        print(f"Sistema de alarme {id_dispositivo} inicializado!")

    def atualizar_configuracoes(self, config):
        """Atualiza as configurações do sistema via MQTT"""
        print("Atualizando configuracoes via MQTT...")
        self.detector_quedas.atualizar_parametros(config)

    async def inicializar(self):
        """Inicialização assíncrona do sistema"""
        # Mostrar splash screen inicial por 3 segundos
        self.display.mostrar_tela('splash')
        await asyncio.sleep(5)
        
        # Limpar splash e liberar memória
        self.display.limpar_splash()
        self.display.mostrar_tela('relogio')

    async def executar(self):
        """Método principal que executa todas as tarefas do sistema"""
        # Inicialização
        await self.inicializar()
        
        # Sincronizar relógio se WiFi disponível
        await self.relogio.sincronizar_horario()

        # Criar tarefas assíncronas
        tasks = [
            asyncio.create_task(self._tarefa_deteccao_quedas()),
            asyncio.create_task(self.acelerometro.monitorar_acelerometro()),
            asyncio.create_task(self.alarme.controlar_alarme()),
            asyncio.create_task(self._tarefa_animacao_alerta()),
            asyncio.create_task(self.rede.verificar_conexao()),
            asyncio.create_task(self.relogio.atualizar_display_horario()),
            asyncio.create_task(self.rede.manter_conexao_mqtt()),
        ]

        try:
            await asyncio.gather(*tasks)
        except Exception as e:
            print(f"Erro no sistema: {e}")

    async def _tarefa_deteccao_quedas(self):
        """Tarefa dedicada à detecção de quedas"""
        while True:
            if self.alarme.sirene_ativa or self.alarme.animacao_ativa:
                await asyncio.sleep(0.5)
                continue

            queda_detectada = await self.detector_quedas.monitorar_quedas()
            if queda_detectada:
                await self.alarme.processar_queda_detectada()

    async def _tarefa_animacao_alerta(self):
        """Tarefa dedicada à animação de alerta"""
        while True:
            if self.alarme.animacao_ativa:
                await self.display.animar_alerta()
                if self.alarme.alarme_ativado:
                    self.alarme.desativar_alarme()
            await asyncio.sleep(0.1)


async def main():
    sistema = SistemaAlarme('dc:b4:d9:8b:6c:f0', 'GC9A01A')
    await sistema.executar()

if __name__ == 'VestaWatch_mqtt' or __name__ == '__main__':
    try:
        asyncio.run(main())
    except Exception as e:
        print(f"Erro fatal: {e}")
        time.sleep(3)
        reset()