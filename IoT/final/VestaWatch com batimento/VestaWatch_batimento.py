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
import adafruit_minimqtt.adafruit_minimqtt as MQTT
import adafruit_lis3dh
from adafruit_lis3dh import LIS3DH_I2C, RANGE_8_G, STANDARD_GRAVITY
import json
from fourwire import FourWire

# Tentar importar terminalio para fonte padrão
try:
    import terminalio
    FONTE_PADRAO = bitmap_font.load_font("/fonts/scientificaBold-11.bdf")
except ImportError:
    FONTE_PADRAO = terminalio.FONT
    print('erro na importação da fonte')

gc.collect()

# =============================================================================
# MOCK SENSOR CARDÍACO (COM WRAPPER COMPLETO)
# =============================================================================
try:
    import qwiic_max3010x
except ImportError:
    class MockQwiicMax3010x:
        def __init__(self, i2c_driver=None): pass
        def begin(self): return True
        def setup(self, **kwargs): pass
        def setPulseAmplitudeRed(self, amplitude): pass
        def setPulseAmplitudeIR(self, amplitude): pass
        def getIR(self): return 50000
        def getRed(self): return 50000
    qwiic_max3010x = type('MockModule', (), {'QwiicMax3010x': MockQwiicMax3010x})()

class SensorCardiacoAsync:
    def __init__(self, i2c_bus):
        self.i2c = i2c_bus
        self.wrapper = self._criar_wrapper(i2c_bus)
        self.sensor = None
        self.configurado = False
        self.POTENCIA_LED = 7
        self.ADC_RANGE = 1024
        self._inicializar_sensor()

    def _criar_wrapper(self, i2c_bus):
        class I2CWrapper:
            def __init__(self, bus): 
                self.i2c = bus
                
            def isDeviceConnected(self, a):
                while not self.i2c.try_lock(): pass
                try: 
                    return a in self.i2c.scan()
                finally: 
                    self.i2c.unlock()
                    
            def writeto(self, a, d):
                while not self.i2c.try_lock(): pass
                try: 
                    self.i2c.writeto(a, d)
                finally: 
                    self.i2c.unlock()
                    
            def writeto_then_readfrom(self, a, o, i):
                while not self.i2c.try_lock(): pass
                try: 
                    self.i2c.writeto_then_readfrom(a, o, i)
                finally: 
                    self.i2c.unlock()
            
            # MÉTODOS ADICIONAIS QUE A BIBLIOTECA ESPERA
            def readByte(self, a, r):
                b = bytearray(1)
                self.writeto_then_readfrom(a, bytes([r]), b)
                return b[0]
                
            def writeByte(self, a, r, v):
                self.writeto(a, bytes([r, v]))
                
            def readBlock(self, a, r, l):
                b = bytearray(l)
                self.writeto_then_readfrom(a, bytes([r]), b)
                return list(b)
                
        return I2CWrapper(i2c_bus)

    def _inicializar_sensor(self):
        try:
            self.sensor = qwiic_max3010x.QwiicMax3010x(i2c_driver=self.wrapper)
            if self.sensor.begin():
                self.sensor.setup(ledMode=2, sampleRate=400, pulseWidth=411, adcRange=self.ADC_RANGE)
                # DESLIGAR LEDs inicialmente - só ligar durante medição
                self.sensor.setPulseAmplitudeRed(0)
                self.sensor.setPulseAmplitudeIR(0)
                self.configurado = True
                print("[SENSOR] Iniciado com sucesso (LEDs desligados)")
            else:
                print("[SENSOR] Dispositivo não encontrado")
        except Exception as e:
            print(f"[SENSOR] Erro: {e}")

    def atualizar_parametros(self, config):
        """Atualiza parâmetros do sensor via MQTT"""
        atualizou = False
        if "POTENCIA_LED" in config:
            nova_potencia = int(config["POTENCIA_LED"])
            if 1 <= nova_potencia <= 7:
                self.POTENCIA_LED = nova_potencia
                print(f"💡 Potência LED: {self.POTENCIA_LED}")
                atualizou = True
        
        if "ADC_RANGE" in config:
            novo_adc = int(config["ADC_RANGE"])
            if novo_adc in [1024, 2048, 4096, 8192]:
                self.ADC_RANGE = novo_adc
                print(f"📊 Resolução ADC: {self.ADC_RANGE}")
                atualizou = True
        
        return atualizou

    async def medir(self, duracao=10):
        """Realiza medição por X segundos - LEDs só ligam durante medição"""
        if not self.configurado: 
            return None
            
        print(f"[SENSOR] Iniciando medição de {duracao}s...")
        
        # LIGAR LEDs apenas durante a medição
        self.sensor.setPulseAmplitudeRed(self.POTENCIA_LED)
        self.sensor.setPulseAmplitudeIR(self.POTENCIA_LED)
        
        avg_dc, alpha = 0, 0.95
        last_beat, beats_history = time.monotonic(), []
        start_time = time.monotonic()
        
        while (time.monotonic() - start_time) < duracao:
            try:
                ir = self.sensor.getIR()
                if ir < 10000:  # Limiar mais baixo para detectar dedo
                    await asyncio.sleep(0.1)
                    continue
                    
                if avg_dc == 0: 
                    avg_dc = ir
                avg_dc = (alpha * avg_dc) + ((1.0 - alpha) * ir)
                sinal = -(ir - avg_dc)
                
                now = time.monotonic()
                if sinal > 25 and (now - last_beat) > 0.4:  # Ajuste na sensibilidade
                    bpm_inst = 60 / (now - last_beat)
                    if 40 < bpm_inst < 180:  # Faixa mais ampla
                        beats_history.append(bpm_inst)
                        print(f"💓 Batimento: {int(bpm_inst)} BPM")
                    last_beat = now
                
                await asyncio.sleep(0.02)  # Intervalo maior para estabilidade
            except Exception as e:
                print(f"[SENSOR] Erro leitura: {e}")
                await asyncio.sleep(0.1)

        # DESLIGAR LEDs após medição
        self.sensor.setPulseAmplitudeRed(0)
        self.sensor.setPulseAmplitudeIR(0)
        
        print(f"[SENSOR] {len(beats_history)} batimentos detectados")
        
        if len(beats_history) >= 3:
            # Remover outliers (valores muito diferentes da média)
            if len(beats_history) > 5:
                media = sum(beats_history) / len(beats_history)
                beats_filtrados = [b for b in beats_history if abs(b - media) < 30]
                if beats_filtrados:
                    beats_history = beats_filtrados
            
            bpm_final = int(sum(beats_history) / len(beats_history))
            print(f"✅ Medição concluída: {bpm_final} BPM")
            return bpm_final
            
        print("❌ Dados insuficientes para cálculo")
        return None

# =============================================================================
# GERENCIADOR MQTT
# =============================================================================
class GerenciadorMQTT:
    def __init__(self, email, senha, pool, callback_configuracao):
        self.EMAIL = email
        self.SENHA = senha
        self.pool = pool
        self.callback_configuracao = callback_configuracao
        self.topico_config = f"{email}/settings"
        self.topico_queda = f"{email}/queda"
        self.conectado = False
        self.cliente = None
        self._inicializar_mqtt()

    def _inicializar_mqtt(self):
        try:
            self.cliente = MQTT.MQTT(
                broker="maqiatto.com",
                port=1883,
                username=self.EMAIL,
                password=self.SENHA,
                socket_pool=self.pool,
                socket_timeout=0.5,
                keep_alive=30,
            )
            self.cliente.on_connect = self._on_connect
            self.cliente.on_disconnect = self._on_disconnect
            self.cliente.on_message = self._on_message
            print("✅ MQTT inicializado")
        except Exception as e:
            print(f"❌ Erro MQTT: {e}")

    def _on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            print("✅ Conectado MQTT!")
            self.conectado = True
            try:
                client.subscribe(self.topico_config)
                print(f"📨 Inscrito: {self.topico_config}")
            except Exception as e:
                print(f"❌ Erro inscrição: {e}")
        else:
            print(f"❌ Falha MQTT: {rc}")
            self.conectado = False

    def _on_disconnect(self, client, userdata, rc):
        print("🔌 Desconectado MQTT")
        self.conectado = False

    def _on_message(self, client, topic, message):
        try:
            msg = message.decode() if isinstance(message, bytes) else str(message)
            print(f"📥 Mensagem recebida: {msg}")
            
            if topic == self.topico_config:
                self._processar_configuracoes(msg)
        except Exception as e:
            print(f"❌ Erro processar mensagem: {e}")

    def _processar_configuracoes(self, mensagem_json):
        try:
            # Limpeza mais robusta do JSON
            mensagem_limpa = mensagem_json.strip()
            
            # Remover possíveis caracteres inválidos
            mensagem_limpa = ''.join(char for char in mensagem_limpa if ord(char) >= 32 or char in '\r\n\t')
            
            if not mensagem_limpa.startswith('{') or not mensagem_limpa.endswith('}'):
                print(f"⚠️ JSON inválido: {mensagem_limpa}")
                return

            config = json.loads(mensagem_limpa)
            print(f"⚙️ Configurações recebidas: {config}")
            
            if self.callback_configuracao:
                self.callback_configuracao(config)
        except json.JSONDecodeError as e:
            print(f"❌ Erro decodificar JSON: {e}")
            print(f"📝 Mensagem problemática: {mensagem_json}")
        except Exception as e:
            print(f"❌ Erro processar configurações: {e}")

    async def conectar(self):
        if not hasattr(self, 'pool') or not self.pool:
            print("⚠️ Pool não disponível")
            return False

        try:
            if not self.conectado:
                print("🔗 Conectando MQTT...")
                self.cliente.connect()
                return True
            return True
        except Exception as e:
            print(f"❌ Falha conexão: {e}")
            self.conectado = False
            return False

    async def publicar_queda(self, dados_aceleracao):
        if not self.conectado:
            if not await self.conectar():
                return False

        try:
            payload = {
                "x": round(dados_aceleracao[0], 2),
                "y": round(dados_aceleracao[1], 2), 
                "z": round(dados_aceleracao[2], 2),
                "fall": True,
                "timestamp": time.monotonic()
            }
            
            self.cliente.publish(self.topico_queda, json.dumps(payload))
            print("🚨 Queda publicada via MQTT")
            return True
        except Exception as e:
            print(f"❌ Erro publicar queda: {e}")
            self.conectado = False
            return False

    async def manter_conexao(self):
        while True:
            try:
                if self.conectado:
                    self.cliente.loop(timeout=0.5)
                elif hasattr(self, 'pool') and self.pool:
                    await self.conectar()
            except Exception as e:
                print(f"❌ Erro loop MQTT: {e}")
                self.conectado = False
            await asyncio.sleep(2)

# =============================================================================
# GERENCIADOR HARDWARE
# =============================================================================
class GerenciadorHardware:
    def __init__(self, display_type='GC9A01A'):
        self.display_type = display_type
        self.tft_bkl = None
        self.lis3dh = None
        self.display = None
        self.sensor_cardiaco = None

        self.TFT_CS = board.IO7
        self.TFT_DC = board.IO10
        self.TFT_RST = board.IO3
        self.TFT_BKL_PIN = board.IO0
        self.SCL = board.SCL
        self.SDA = board.SDA

        self._inicializar_hardware()

    def _inicializar_hardware(self):
        try:
            i2c = busio.I2C(self.SCL, self.SDA)
            
            # Display
            if self.display_type == 'SSD1306':
                import adafruit_displayio_ssd1306
                displayio.release_displays()
                display_bus = i2cdisplaybus.I2CDisplayBus(i2c, device_address=0x3C)
                self.display = adafruit_displayio_ssd1306.SSD1306(display_bus, width=128, height=64)
            else:
                displayio.release_displays()
                import adafruit_gc9a01a
                self.tft_bkl = digitalio.DigitalInOut(self.TFT_BKL_PIN)
                self.tft_bkl.direction = digitalio.Direction.OUTPUT
                self.tft_bkl.value = False
                spi = board.SPI()
                display_bus = FourWire(spi, command=self.TFT_DC, chip_select=self.TFT_CS, reset=self.TFT_RST)
                self.display = adafruit_gc9a01a.GC9A01A(display_bus, width=240, height=240)

            # Acelerômetro
            int1 = digitalio.DigitalInOut(board.IO1)
            int1.direction = digitalio.Direction.INPUT
            int1.pull = digitalio.Pull.UP
            self.lis3dh = LIS3DH_I2C(i2c, address=0x19, int1=int1)
            self.lis3dh.range = RANGE_8_G
            self.lis3dh.set_tap(2, 60)

            # Sensor cardíaco
            try:
                self.sensor_cardiaco = SensorCardiacoAsync(i2c)
            except Exception as e:
                print(f"❌ Erro sensor cardíaco: {e}")

            print("✅ Hardware OK")
        except Exception as e:
            print(f"❌ Erro hardware: {e}")
            raise

    def verificar_tap_duplo(self):
        try: 
            if self.lis3dh.tapped:
                return True
            return False
        except: 
            return False

    def controlar_backlight(self, estado):
        if self.tft_bkl: 
            self.tft_bkl.value = estado

    def ler_aceleracao(self):
        try: 
            return [v / STANDARD_GRAVITY for v in self.lis3dh.acceleration]
        except: 
            return 0, 0, 0

# =============================================================================
# GERENCIADOR DISPLAY (COM INDICADOR WIFI CENTRALIZADO)
# =============================================================================
class GerenciadorDisplay:
    def __init__(self, hardware, display_type):
        self.hardware = hardware
        self.display_type = display_type
        self.display_ligado = False
        self.ultima_atividade = time.monotonic()
        self.tempo_timeout = 30

        # USAR APENAS TERMINALIO.FONT PARA EVITAR ERROS
        self.fonte_relogio = FONTE_PADRAO

        self.grupo_relogio = displayio.Group()
        self.grupo_medicao = displayio.Group()
        
        self.clock_label = None
        self.wifi_label = None
        self.heart_label = None
        self.heart_medicao_label = None
        self.bpm_label = None

        self._inicializar_telas()

    def _inicializar_telas(self):
        self._inicializar_relogio()
        self._inicializar_medicao()

    def _inicializar_relogio(self):
        if self.display_type == 'SSD1306':
            width, height, x_pos, y_pos = 128, 64, 64, 32
            x_wifi, y_wifi, x_heart, y_heart = 64, 5, 10, 5  # WiFi mais centralizado
        else:
            width, height, x_pos, y_pos = 240, 240, 120, 120
            x_wifi, y_wifi, x_heart, y_heart = 120, 30, 110, 180  # WiFi centralizado no topo

        # Fundo simples
        color_bitmap = displayio.Bitmap(width, height, 1)
        color_palette = displayio.Palette(1)
        color_palette[0] = 0x000000
        bg_sprite = displayio.TileGrid(color_bitmap, pixel_shader=color_palette, x=0, y=0)
        self.grupo_relogio.append(bg_sprite)

        # Relógio com fonte terminalio
        self.clock_label = label.Label(
            self.fonte_relogio,
            text="--:--", 
            color=0xFFFFFF,
            scale=6 if self.display_type == 'GC9A01A' else 2,
            anchor_point=(0.5, 0.5), 
            anchored_position=(x_pos, y_pos)
        )

        # WiFi CENTRALIZADO no topo
        self.wifi_label = label.Label(
            self.fonte_relogio, 
            text="", 
            color=0x00FF00, 
            scale=2,
            anchor_point=(0.5, 0), 
            anchored_position=(x_wifi, y_wifi)
        )
        
        # Heart no canto
        self.heart_label = label.Label(
            self.fonte_relogio,
            text="", 
            color=0xFF0000, 
            scale=2,
            anchor_point=(0, 0), 
            anchored_position=(x_heart, y_heart)
        )

        self.grupo_relogio.append(self.clock_label)
        self.grupo_relogio.append(self.wifi_label)
        self.grupo_relogio.append(self.heart_label)

    def _inicializar_medicao(self):
        if self.display_type == 'SSD1306':
            x_pos, y_pos = 64, 32
        else:
            x_pos, y_pos = 120, 100  # Mais para cima para dar espaço ao BPM

        # Fundo
        color_bitmap = displayio.Bitmap(240, 240, 1) if self.display_type != 'SSD1306' else displayio.Bitmap(128, 64, 1)
        color_palette = displayio.Palette(1)
        color_palette[0] = 0x000000
        bg_sprite = displayio.TileGrid(color_bitmap, pixel_shader=color_palette, x=0, y=0)
        self.grupo_medicao.append(bg_sprite)

        # Elementos medição
        self.heart_medicao_label = label.Label(
            self.fonte_relogio,
            text="BPM", 
            color=0xFF0000, 
            scale=4,
            anchor_point=(0.5, 0.5), 
            anchored_position=(x_pos, y_pos)
        )
        
        self.bpm_label = label.Label(
            self.fonte_relogio,
            text="Medindo...", 
            color=0xFFFFFF, 
            scale=2,
            anchor_point=(0.5, 0), 
            anchored_position=(x_pos, y_pos + 60)
        )

        self.grupo_medicao.append(self.heart_medicao_label)
        self.grupo_medicao.append(self.bpm_label)

    def mostrar_tela(self, tela):
        telas = {'relogio': self.grupo_relogio, 'medicao': self.grupo_medicao}
        if tela in telas:
            self.hardware.display.root_group = telas[tela]
            self.hardware.controlar_backlight(True)
            self.display_ligado = True
            self.ultima_atividade = time.monotonic()

    def atualizar_relogio(self, hora_str):
        if self.clock_label: 
            self.clock_label.text = hora_str

    def atualizar_wifi_status(self, conectado):
        if self.wifi_label: 
            self.wifi_label.text = 'WiFi' if conectado else ''

    def atualizar_heart_status(self, batimento=None):
        if self.heart_label: 
            if batimento:
                self.heart_label.anchored_position = (80,180)
                self.heart_label.text = f'BPM  {batimento}'
                self.heart_label.color = 0xFF0000  # Vermelho quando tem valor
            else:
                self.heart_label.text = ''
                self.heart_label.color = 0x666666  # Cinza quando não tem valor

    def resetar_heart_status(self):
        """Reseta o indicador de heart para estado inicial"""
        if self.heart_label:
            self.heart_label.text = 'BPM'
            self.heart_label.anchored_position = (110,180)
            self.heart_label.color = 0x666666

    def atualizar_bpm_medicao(self, bpm=None):
        if self.bpm_label: 
            self.bpm_label.text = f'BPM: {bpm}' if bpm else "Medindo..."

    async def animar_coracao(self, duracao=10):
        start_time = time.monotonic()
        while time.monotonic() - start_time < duracao:
            for scale in [3, 4, 5, 4, 3]:
                self.heart_medicao_label.scale = scale
                await asyncio.sleep(0.15)

    def ligar_display(self):
        if not self.display_ligado:
            self.mostrar_tela('relogio')
            self.ultima_atividade = time.monotonic()
            return True
        return False

    def desligar_display_por_timeout(self):
        if self.display_ligado and (time.monotonic() - self.ultima_atividade > self.tempo_timeout):
            self.hardware.display.root_group = None
            self.hardware.controlar_backlight(False)
            self.display_ligado = False
            return True
        return False

# =============================================================================
# DETECTOR DE QUEDAS
# =============================================================================
class DetectorQuedas:
    def __init__(self, hardware, gerenciador_mqtt, limiar_queda_livre=0.6, limiar_impacto=2, 
                 amostras_consecutivas=3, intervalo_amostragem=0.05):
        self.hardware = hardware
        self.mqtt = gerenciador_mqtt
        self.FREE_FALL_THRESHOLD = limiar_queda_livre
        self.IMPACT_THRESHOLD = limiar_impacto
        self.CONSECUTIVE_SAMPLES = amostras_consecutivas
        self.SAMPLE_INTERVAL = intervalo_amostragem

        self.sample_count = 0
        self.em_queda_livre = False

    def atualizar_parametros(self, config):
        """Atualiza parâmetros via MQTT"""
        if "FREE_FALL_THRESHOLD" in config:
            self.FREE_FALL_THRESHOLD = float(config["FREE_FALL_THRESHOLD"])
            print(f"📉 Limiar queda: {self.FREE_FALL_THRESHOLD}")
        if "IMPACT_THRESHOLD" in config:
            self.IMPACT_THRESHOLD = float(config["IMPACT_THRESHOLD"])
            print(f"📈 Limiar impacto: {self.IMPACT_THRESHOLD}")
        if "CONSECUTIVE_SAMPLES" in config:
            self.CONSECUTIVE_SAMPLES = int(config["CONSECUTIVE_SAMPLES"])
            print(f"🔢 Amostras: {self.CONSECUTIVE_SAMPLES}")
        if "SAMPLE_INTERVAL" in config:
            self.SAMPLE_INTERVAL = float(config["SAMPLE_INTERVAL"])
            print(f"⏱️ Intervalo: {self.SAMPLE_INTERVAL}")

    async def monitorar_quedas(self):
        """Monitora quedas e publica via MQTT"""
        while True:
            try:
                x, y, z = self.hardware.ler_aceleracao()
                accel_total = (x**2 + y**2 + z**2)**0.5

                if not self.em_queda_livre:
                    if accel_total < self.FREE_FALL_THRESHOLD:
                        self.sample_count += 1
                        if self.sample_count >= self.CONSECUTIVE_SAMPLES:
                            self.em_queda_livre = True
                            print(f"📉 Queda livre detectada: {accel_total:.2f}g")
                    else:
                        self.sample_count = 0
                else:
                    if accel_total > self.IMPACT_THRESHOLD:
                        print(f"📈 Impacto detectado: {accel_total:.2f}g")
                        self.em_queda_livre = False
                        self.sample_count = 0
                        
                        # PUBLICAR QUEDA VIA MQTT
                        await self.mqtt.publicar_queda((x, y, z))
                        return True

                    elif accel_total > (self.FREE_FALL_THRESHOLD + 0.3):
                        print("⚠️ Falso positivo - resetando")
                        self.em_queda_livre = False
                        self.sample_count = 0

                await asyncio.sleep(self.SAMPLE_INTERVAL)

            except Exception as e:
                print(f"❌ Erro detecção: {e}")
                await asyncio.sleep(1)

# =============================================================================
# CONTROLADOR ACELERÔMETRO (COM MEDIÇÃO APENAS NO TAP DUPLO)
# =============================================================================
class ControladorAcelerometro:
    def __init__(self, hardware, display, limiar_y=0.8):
        self.hardware = hardware
        self.display = display
        self.LIMIAR_Y = limiar_y
        self.medicao_ativa = False

    async def iniciar_medicao_cardio(self):
        """Inicia medição cardíaca apenas quando solicitada por tap duplo"""
        if self.medicao_ativa: 
            print("⚠️ Medição já em andamento")
            return
            
        self.medicao_ativa = True
        print("💓 Iniciando medição cardíaca por 10 segundos...")
        
        # Mostrar tela de medição
        self.display.mostrar_tela('medicao')
        
        # Executar animação e medição simultaneamente
        tarefa_animacao = asyncio.create_task(self.display.animar_coracao(10))
        tarefa_medicao = asyncio.create_task(self.hardware.sensor_cardiaco.medir(10))
        
        # Aguardar resultados
        bpm = await tarefa_medicao
        await tarefa_animacao  # Garantir que a animação termine
        
        # Processar resultado
        if bpm:
            self.display.atualizar_bpm_medicao(bpm)
            self.display.atualizar_heart_status(bpm)
            print(f"✅ Medição finalizada: {bpm} BPM")
            await asyncio.sleep(3)  # Mostrar resultado por 3 segundos
        else:
            self.display.atualizar_bpm_medicao("Falha")
            print("❌ Falha na medição")
            await asyncio.sleep(2)
        
        # Resetar display
        self.display.atualizar_bpm_medicao(None)  # Limpar texto
        self.display.mostrar_tela('relogio')
        self.medicao_ativa = False

    async def monitorar_acelerometro(self):
        """Monitora continuamente o acelerômetro para tap duplo e orientação"""
        while True:
            try:
                # Verificar tap duplo para iniciar medição
                if self.hardware.verificar_tap_duplo() and not self.medicao_ativa:
                    print("👆 Tap duplo detectado - iniciando medição")
                    asyncio.create_task(self.iniciar_medicao_cardio())

                # Verificar orientação para ligar display
                x, y, z = self.hardware.ler_aceleracao()
                if abs(y) > self.LIMIAR_Y and not self.display.display_ligado:
                    self.display.ligar_display()

                # Verificar timeout do display
                self.display.desligar_display_por_timeout()
                
                await asyncio.sleep(0.1)
                
            except Exception as e:
                print(f"❌ Erro monitoramento acelerômetro: {e}")
                await asyncio.sleep(0.1)

# =============================================================================
# GERENCIADOR REDE
# =============================================================================
class GerenciadorRede:
    def __init__(self):
        self.wifi_conectado = False
        self.pool = None
        self._conectar_wifi()

    def _conectar_wifi(self):
        try:
            ssid = os.getenv("WIFI_SSID")
            password = os.getenv("WIFI_PASSWORD")
            wifi.radio.connect(ssid, password)
            self.pool = socketpool.SocketPool(wifi.radio)
            self.wifi_conectado = True
            print("✅ WiFi conectado!")
            gc.collect()
        except Exception as e:
            print(f"❌ WiFi não disponível: {e}")
            self.wifi_conectado = False

    async def verificar_conexao(self):
        while True:
            try:
                if not self.wifi_conectado:
                    self._conectar_wifi()
                elif not wifi.radio.ipv4_address:
                    print("❌ Conexão WiFi perdida")
                    self.wifi_conectado = False
            except Exception as e:
                self.wifi_conectado = False
            await asyncio.sleep(10)

# =============================================================================
# SISTEMA RELÓGIO
# =============================================================================
class SistemaRelogio:
    def __init__(self, rede, display):
        self.rede = rede
        self.display = display
        self.ultima_atualizacao = 0
        self.segundo_par = False

    async def sincronizar_horario(self):
        if self.rede.wifi_conectado:
            try:
                ntp = adafruit_ntp.NTP(self.rede.pool, tz_offset=-3)
                rtc.RTC().datetime = ntp.datetime
                print("⏰ Relógio sincronizado via NTP")
                ntp = None
                gc.collect()
            except Exception as e:
                print(f"❌ Erro sincronizar relógio: {e}")

    async def atualizar_display_horario(self):
        while True:
            if not self.display.display_ligado:
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

# =============================================================================
# SISTEMA PRINCIPAL
# =============================================================================
class SistemaAlarme:
    def __init__(self, id_dispositivo, display_type='GC9A01A'):
        self.id_dispositivo = id_dispositivo
        
        print("🚀 Inicializando sistema VESTA...")
        
        # Inicializar componentes
        self.rede = GerenciadorRede()
        self.hardware = GerenciadorHardware(display_type)
        self.display = GerenciadorDisplay(self.hardware, display_type)
        
        # MQTT (após rede)
        self.mqtt = GerenciadorMQTT(
            email="x4cajh8pu@mozmail.com",
            senha="123", 
            pool=self.rede.pool,
            callback_configuracao=self._callback_configuracao_mqtt
        )
        
        self.detector_quedas = DetectorQuedas(self.hardware, self.mqtt)
        self.acelerometro = ControladorAcelerometro(self.hardware, self.display)
        self.relogio = SistemaRelogio(self.rede, self.display)

        # Atualizar status WiFi inicial
        self.display.atualizar_wifi_status(self.rede.wifi_conectado)

        gc.collect()
        print(f"✅ Sistema {id_dispositivo} inicializado!")

    def _callback_configuracao_mqtt(self, config):
        """Processar configurações MQTT"""
        print(f"⚙️ Processando configurações MQTT: {list(config.keys())}")
        
        # Encaminhar para módulos específicos
        self.detector_quedas.atualizar_parametros(config)
        
        if self.hardware.sensor_cardiaco:
            self.hardware.sensor_cardiaco.atualizar_parametros(config)

    async def executar(self):
        """Método principal do sistema"""
        self.display.mostrar_tela('relogio')
        await asyncio.sleep(1)
        
        # Sincronizar relógio se WiFi disponível
        await self.relogio.sincronizar_horario()

        # Criar todas as tarefas assíncronas
        tasks = [
            asyncio.create_task(self.detector_quedas.monitorar_quedas()),
            asyncio.create_task(self.acelerometro.monitorar_acelerometro()),
            asyncio.create_task(self.rede.verificar_conexao()),
            asyncio.create_task(self.relogio.atualizar_display_horario()),
            asyncio.create_task(self.mqtt.manter_conexao()),
        ]

        try:
            await asyncio.gather(*tasks)
        except Exception as e:
            print(f"❌ Erro no sistema: {e}")

# =============================================================================
# FUNÇÃO PRINCIPAL
# =============================================================================
async def main():
    sistema = SistemaAlarme('VESTA', 'GC9A01A')
    await sistema.executar()

if __name__ == 'VestaWatch_batimento' or __name__ == '__main__':
    try:
        asyncio.run(main())
    except Exception as e:
        print(f"💥 Erro fatal: {e}")
        time.sleep(3)
        reset()