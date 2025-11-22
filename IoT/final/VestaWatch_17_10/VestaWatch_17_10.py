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
# --- Novos imports para o display GC9A01A ---
import adafruit_gc9a01a
from fourwire import FourWire

# Liberar memória imediatamente ao iniciar
gc.collect()

class SistemaAlarme():
    def __init__(self, id_queda_watch):
        # --- Configurações padrão ---
        self.FREE_FALL_THRESHOLD = 0.6
        self.IMPACT_THRESHOLD = 2
        self.CONSECUTIVE_SAMPLES = 3
        self.SAMPLE_INTERVAL = 0.05
        
        # --- ThingSpeak Configuration ---
        self.tswriteAPI = os.getenv("thingspeak_write_api_key")
        self.API_URL = "http://api.thingspeak.com"
        
        # --- Estado do sistema ---
        self.alarme = False
        self.sample_count = 0
        self.animacao_ativa = False
        self.fase_alarme = "inicial"
        self.wifi_conectado = False
        self.ultimo_envio_thingspeak = 0
        self.alarme_para_thingspeak = 0
        self.intervalo_thingspeak = 60
        self.sirene_ativa = False
        self.ultima_queda_detectada = 0
        self.intervalo_minimo_queda = 5  # Reduzido para 5 segundos
        
        # --- Otimização de memória ---
        self.requests_onrender = None
        self.requests = None
        self.pool = None
        self.mqtt_client = None
        self.ntp = None
        self._https_session_ativa = False
        self._mqtt_conectado = False
        
        # --- Configuração de hardware ---
        self.id_queda_watch = id_queda_watch
        self._inicializar_hardware()

        # --- Configuração MQTT ---
        self.seu_email = "x4cajh8pu@mozmail.com"
        self.sua_senha = "123"
        self.topico = f"{self.seu_email}/meu_topico"
        
        # --- Tentar conectar WiFi ---
        self._conectar_wifi()
        
        # --- Configuração NTP e RTC (se WiFi disponível) ---
        self.acertar_relogio()
        
        # --- Buzzer ---
        self.buzzer = pwmio.PWMOut(board.IO20, variable_frequency=True)
        self.buzzer.duty_cycle = 0
        
        # --- LEDs ---
        self.led_thing = digitalio.DigitalInOut(board.IO2)
        self.led_thing.direction = digitalio.Direction.OUTPUT
        self.led_thing.value = False
        
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
        time.sleep(2)
        self.display.root_group = self.grupo_relogio
        
        gc.collect()
        
    def _inicializar_hardware(self):
        """Configura todos os componentes de hardware"""
        try:
            i2c = busio.I2C(board.SCL, board.SDA)
            
                        # --- Display GC9A01A (240x240) ---
            displayio.release_displays()
            
            # Configuração dos pinos SPI para o GC9A01A
            spi = board.SPI()
            tft_cs = board.IO7
            tft_dc = board.IO10
            tft_rst = board.IO3
            
            # Backlight
            tft_bkl = digitalio.DigitalInOut(board.IO0)  
            tft_bkl.direction = digitalio.Direction.OUTPUT
            tft_bkl.value = True
            
            display_bus = FourWire(
                spi,
                command=tft_dc,
                chip_select=tft_cs,
                reset=tft_rst
            )
            # Inicializar display GC9A01A
            self.display = adafruit_gc9a01a.GC9A01A(
                display_bus,
                width=240,
                height=240,
                rotation=0  # Ajuste conforme necessário
            )
            self.display.root_group = None
            
            # --- Acelerômetro LIS3DH ---
            int1 = digitalio.DigitalInOut(board.IO1)
            int1.direction = digitalio.Direction.INPUT
            int1.pull = digitalio.Pull.UP
            self.lis3dh = LIS3DH_I2C(i2c, address=0x19, int1=int1)
            self.lis3dh.set_tap(2, 60)
            self.lis3dh.range = RANGE_8_G
            
            print(f'ID do dispositivo {self.id_queda_watch}')
            print(" Hardware inicializado com sucesso!")            
        except Exception as e:
            print(f" Erro na inicialização do hardware: {repr(e)}")
            time.sleep(2)
            reset()
            raise
    
    def verificar_tap_duplo(self):
        try: 
            if self.lis3dh.tapped:
                return True
            return False
        except: 
            return False
    
    def acertar_relogio(self):
        """Sincroniza o relógio via NTP - com otimização de memória"""
        if self.wifi_conectado:
            try:
                if hasattr(self, 'ntp'):
                    self.ntp = None
                
                self.ntp = adafruit_ntp.NTP(self.pool, tz_offset=-3, cache_seconds=3600)
                rtc.RTC().datetime = self.ntp.datetime
                print(" Relogio sincronizado via NTP")
                
                self.ntp = None
                gc.collect()
                
            except Exception as e:
                print(f" Erro ao sincronizar relogio: {repr(e)}")
    
    def _conectar_wifi(self):
        """Tenta conectar ao WiFi com otimização de memória"""
        try:
            ssid = os.getenv("WIFI_SSID")
            password = os.getenv("WIFI_PASSWORD")
            wifi.radio.connect(ssid, password)
            self.pool = socketpool.SocketPool(wifi.radio)
            self.requests = adafruit_requests.Session(self.pool)
            
            self.wifi_conectado = True
            print(" WiFi conectado!")
            print(f" IP: {wifi.radio.ipv4_address}")
            
            self._mqtt_conectado = False
            
            gc.collect()
            
        except Exception as e:
            print(f" WiFi nao disponivel: {repr(e)}")
            self.wifi_conectado = False

    def _conectar_mqtt(self):
        """Conecta MQTT apenas quando necessário"""
        if not self.wifi_conectado or self._mqtt_conectado:
            return True
            
        try:
            print("Conectando MQTT...")
            self.mqtt_client = MQTT.MQTT(
                broker="maqiatto.com",
                port=1883,
                username=self.seu_email,
                password=self.sua_senha,
                socket_pool=self.pool,
                socket_timeout=0.3,
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
            print(f"Erro ao conectar MQTT: {repr(e)}")
            self._mqtt_conectado = False
            return False

    def _desconectar_mqtt(self):
        """Desconecta MQTT para liberar memória"""
        if self.mqtt_client and self._mqtt_conectado:
            try:
                print("Desconectando MQTT para liberar memoria...")
                self.mqtt_client.disconnect()
                self.mqtt_client = None
                self._mqtt_conectado = False
                gc.collect()
                print("MQTT desconectado")
            except Exception as e:
                print(f"Erro ao desconectar MQTT: {repr(e)}")

    def _on_mqtt_connect(self, client, userdata, flags, rc):
        """Callback chamado quando o MQTT se conecta"""
        print(f"=== MQTT CONECTADO ===")
        print(f"Codigo: {rc}")
        
        topico = f"{self.seu_email}/settings"
        client.subscribe(topico)
        print(f"Inscrito no topico: {topico}")
        print("=====================")

    def _on_mqtt_disconnect(self, client, userdata, rc):
        """Callback chamado quando o MQTT desconecta."""
        print("=== MQTT DESCONECTADO ===")
        self._mqtt_conectado = False

    def _on_mqtt_message(self, client, topic, message):
        """Callback chamado quando uma mensagem chega"""
        print(f"=== MENSAGEM MQTT RECEBIDA ===")
        print(f"Topico: {topic}")
        print(f"Mensagem: {message}")
        
        try:
            msg_str = message.decode() if isinstance(message, bytes) else str(message)
            print("--- Mensagem decodificada ---")
            
            if topic == f"{self.seu_email}/settings":
                self.processar_configuracoes(msg_str)
                
        except Exception as e:
            print(f"Erro ao processar mensagem MQTT: {repr(e)}")
        print("===============================")

    def processar_configuracoes(self, mensagem):
        """Processa as configuracoes recebidas via MQTT"""
        print("--- Processando configuracoes ---")
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
                            chave = chave.strip()
                            valor = valor.strip()
                            
                            chave = chave.replace('"', '').replace("'", "")
                            
                            try:
                                if '.' in valor:
                                    config[chave] = float(valor)
                                else:
                                    config[chave] = int(valor)
                            except ValueError:
                                config[chave] = valor
                
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
                
                print("Configuracoes atualizadas com sucesso!")
            else:
                print("Formato de mensagem invalido")
                
        except Exception as e:
            print(f"Erro ao processar configuracoes: {repr(e)}")

    async def mqtt_loop(self):
        """Tarefa MQTT otimizada - conecta/desconecta dinamicamente"""
        contador = 0
        
        while True:
            if self.sirene_ativa:
                await asyncio.sleep(0.1)
                continue
                
            if self.wifi_conectado:
                try:
                    # Conecta MQTT se necessário
                    if not self._mqtt_conectado:
                        if self._conectar_mqtt():
                            await asyncio.sleep(1)
                        else:
                            await asyncio.sleep(5)
                            continue
                    
                    # Processa mensagens
                    self.mqtt_client.loop(0.5)
                    
                    contador += 1
                    
                    # A cada 2 minutos, verifica se precisa desconectar para economizar memória
                    if contador % 1200 == 0:
                        print("Verificando memoria para MQTT...")
                        if gc.mem_free() < 25000:
                            print("Memoria baixa, desconectando MQTT")
                            self._desconectar_mqtt()
                        else:
                            print(f"MQTT ativo - Memoria: {gc.mem_free()} bytes")
                        gc.collect()
                        
                except Exception as e:
                    print(f"Erro no loop MQTT: {repr(e)}")
                    self._mqtt_conectado = False
                    await asyncio.sleep(5)
            else:
                await asyncio.sleep(5)
            
            await asyncio.sleep(0.1)

    def _criar_sessao_https(self):
        """Cria sessão HTTPS com gerenciamento de memória"""
        if self._https_session_ativa:
            return True
            
        try:
            # Desconectar MQTT para liberar memória antes de criar sessão HTTPS
            self._desconectar_mqtt()
            
            print("Criando sessao HTTPS...")
            # Coleta de lixo AGGRESSIVA antes de criar sessão
            for _ in range(3):
                gc.collect()
                time.sleep(0.1)
                
            memoria_inicial = gc.mem_free()
            
            self.requests_onrender = adafruit_requests.Session(self.pool, ssl.create_default_context())
            self._https_session_ativa = True
            
            memoria_final = gc.mem_free()
            print(f"Sessao HTTPS criada. Memoria usada: {memoria_inicial - memoria_final} bytes")
            print(f"Memoria disponivel: {memoria_final} bytes")
            return True
            
        except Exception as e:
            print(f"Falha ao criar sessao HTTPS: {repr(e)}")
            self.requests_onrender = None
            self._https_session_ativa = False
            return False

    def _limpar_sessao_https(self):
        """Limpa a sessão HTTPS para liberar memória"""
        if self.requests_onrender:
            print("Limpando sessao HTTPS para liberar memoria...")
            self.requests_onrender = None
            self._https_session_ativa = False
            # Coleta de lixo agressiva
            for _ in range(3):
                gc.collect()
                time.sleep(0.1)

    async def enviar_https_ultra_seguro(self, url, payload):
        """Envia requisição HTTPS com gerenciamento ULTRA seguro de memória"""
        max_tentativas = 3
        while self.sirene_ativa:
                await asyncio.sleep(0.1)
                
        
        for tentativa in range(max_tentativas):
            try:
                # VERIFICAÇÃO AGGRESSIVA DE MEMÓRIA
                memoria_atual = gc.mem_free()
                print(f"Tentativa {tentativa + 1} - Memoria disponivel: {memoria_atual} bytes")
                
                if memoria_atual < 30000:
                    print("Memoria muito baixa, limpando agressivamente...")
                    self._limpar_sessao_https()
                    # Liberar memória de forma agressiva
                    for _ in range(5):
                        gc.collect()
                        await asyncio.sleep(0.2)
                    
                    memoria_apos_limpeza = gc.mem_free()
                    print(f"Memoria apos limpeza: {memoria_apos_limpeza} bytes")
                    
                    if memoria_apos_limpeza < 25000:
                        print("Memoria insuficiente mesmo apos limpeza, abortando...")
                        return False
                
                # Criar sessão se necessário
                if not self._criar_sessao_https():
                    print("Falha ao criar sessao HTTPS")
                    await asyncio.sleep(1)
                    continue
                
                # Fazer requisição COM PAYLOAD SIMPLIFICADO
                print(f"Enviando HTTPS (tentativa {tentativa + 1})...")
                
                # Simplificar payload para economizar memória
                payload_simplificado = {
                    "x": round(payload.get("x", 0), 2),
                    "y": round(payload.get("y", 0), 2), 
                    "z": round(payload.get("z", 0), 2),
                    "fall": payload.get("fall", False)
                }
                
                response = self.requests_onrender.post(url, json=payload_simplificado, timeout=15)
                print(f"HTTPS enviado. Status: {response.status_code}")
                
                # Ler e fechar resposta IMEDIATAMENTE
                try:
                    response_text = response.json()
                    print(f"Resposta: {response_text}")
                except:
                    print("Resposta recebida (sem texto)")
                
                response.close()
                response = None
                
                # Limpar imediatamente após sucesso
                self._limpar_sessao_https()
                
                return True
                
            except MemoryError as e:
                print(f"MemoryError grave na tentativa {tentativa + 1}")
                self._limpar_sessao_https()
                # Limpeza agressiva
                for _ in range(5):
                    gc.collect()
                    await asyncio.sleep(0.3)
                
            except Exception as e:
                print(f"Erro HTTPS na tentativa {tentativa + 1}: {repr(e)}")
                self._limpar_sessao_https()
                await asyncio.sleep(1)
        
        print("FALHA CRITICA: Nao foi possivel enviar HTTPS apos todas as tentativas")
        return False

    async def enviar_alarme_backend(self, mensagem):
        '''Publica mensagem no broker maqitto E envia dados via HTTP POST'''
        
        if not self.wifi_conectado:
            print("Sem WiFi, ignorando envio de alarme")
            return
            
        print("=== INICIANDO ENVIO DE ALARME ===")
        
        # --- Bloco 1: Lógica MQTT (conecta temporariamente) ---
        sucesso_mqtt = False
        if mensagem:
            try:
                # Conecta MQTT apenas para enviar
                if self._conectar_mqtt():
                    payload_mqtt = {
                        "x": round(mensagem.get("x", 0), 2),
                        "y": round(mensagem.get("y", 0), 2),
                        "z": round(mensagem.get("z", 0), 2),
                        "fall": mensagem.get("fall", False)
                    }
                    self.mqtt_client.publish("x4cajh8pu@mozmail.com/queda", json.dumps(payload_mqtt), qos=0)
                    self.mqtt_client.loop() 
                    print(" Mensagem MQTT publicada com sucesso!")
                    sucesso_mqtt = True
                else:
                    print("Falha ao conectar MQTT para envio")
                    
            except Exception as e:
                print(f" Erro ao enviar MQTT: {repr(e)}")
                self._mqtt_conectado = False
        else:
            print("Sem mensagem para MQTT")

        # --- Bloco 2: Lógica HTTPS ---
        # REMOVIDA a verificação de intervalo - sempre tenta enviar
        url = 'https://vesta-xyil.onrender.com/device/metric/691509ff87058ba549b905b0'
        
        # Enviar HTTPS de forma ULTRA segura
        print("Tentando enviar via HTTPS...")
        sucesso_https = await self.enviar_https_ultra_seguro(url, mensagem)
        
        # Atualizar timestamp de queda detectada APENAS se for uma queda real
        if mensagem.get("fall", False):
            self.ultima_queda_detectada = time.monotonic()
        
        if sucesso_mqtt or sucesso_https:
            print("✅ Alarme enviado com sucesso!")
        else:
            print("❌ Falha ao enviar alarme")
        
        # Coleta de lixo final agressiva
        for _ in range(3):
            gc.collect()
            await asyncio.sleep(0.1)
            
        print("=== FIM DO ENVIO DE ALARME ===")

    # ... (mantenha os métodos de inicialização de display iguais)

    def _inicializar_splash(self):
        """Configura a tela de splash"""
        while len(self.grupo_splash) > 0:
            self.grupo_splash.pop()
            
        color_bitmap = displayio.Bitmap(240, 240, 1)
        color_palette = displayio.Palette(1)
        color_palette[0] = 0x000000
        bg_sprite = displayio.TileGrid(color_bitmap, pixel_shader=color_palette, x=0, y=0)
        self.grupo_splash.append(bg_sprite)
        
        try:
            bitmap = displayio.OnDiskBitmap(open("logo.bmp", "rb"))
            image = displayio.TileGrid(
                                bitmap,
                                pixel_shader=bitmap.pixel_shader
                                )
            self.grupo_splash.append(image)
        except:
            self.font_splash = bitmap_font.load_font("/fonts/Helvetica-Bold-16.bdf")
            self.splash_label = label.Label(
                self.font_splash,
                text="VESTA",
                color=0xFFFFFF,
                scale=3,
                anchor_point=(0.5, 0.5),
                anchored_position=(120, 120)
            )
            self.grupo_splash.append(self.splash_label)
    
    def _inicializar_relogio(self):
        """Configura a tela do relógio"""
        while len(self.grupo_relogio) > 0:
            self.grupo_relogio.pop()
            
        color_bitmap = displayio.Bitmap(240, 240, 1)
        color_palette = displayio.Palette(1)
        color_palette[0] = 0x000000
        bg_sprite = displayio.TileGrid(color_bitmap, pixel_shader=color_palette, x=0, y=0)
        self.grupo_relogio.append(bg_sprite)
        
        try:
            self.font_relogio = bitmap_font.load_font("/fonts/scientificaBold-11.bdf")
            self.clock_label = label.Label(
                self.font_relogio,
                text="--:--",
                color=0xFFFFFF,
                scale=6,
                anchor_point=(0.5, 0.5),
                anchored_position=(120, 120)
            )
            # Use a mesma fonte ou uma fonte menor para o WiFi
            self.wifi_label = label.Label(
                self.font_relogio,
                text="Wifi" if self.wifi_conectado else "",
                color=0x00FF00,  # Verde quando conectado
                scale=2,
                anchor_point=(0.5, 0.5),
                anchored_position=(120, 30)  # Centralizado no topo
            )
        except:
            self.clock_label = label.Label(
                None,
                text="--:--",
                color=0xFFFFFF,
                scale=6,
                anchor_point=(0.5, 0.5),
                anchored_position=(120, 120)
            )
            self.wifi_label = label.Label(
                None,
                text="Wifi" if self.wifi_conectado else "",
                color=0x00FF00,
                scale=1,
                anchor_point=(0.5, 0.5),
                anchored_position=(120, 30)
            )
        
        self.grupo_relogio.append(self.clock_label)
        self.grupo_relogio.append(self.wifi_label)
    
    
    def _inicializar_alerta(self):
        """Configura a tela de alerta de queda MELHORADA"""
        while len(self.grupo_alerta) > 0:
            self.grupo_alerta.pop()
            
        self.alerta_bitmap = displayio.Bitmap(240, 240, 1)
        self.alerta_palette = displayio.Palette(1)
        self.alerta_palette[0] = 0x000000
        bg_sprite = displayio.TileGrid(self.alerta_bitmap, pixel_shader=self.alerta_palette, x=0, y=0)
        self.grupo_alerta.append(bg_sprite)
        
        try:
            self.font_alerta = bitmap_font.load_font("/fonts/Helvetica-Bold-16.bdf")
            self.alert_label = label.Label(
                self.font_alerta,
                text="QUEDA!",
                color=0xFFFFFF,
                scale=3,
                anchor_point=(0.5, 0.5),
                anchored_position=(120, 120)
            )
        except:
            self.alert_label = label.Label(
                None,
                text="QUEDA!",
                color=0xFFFFFF,
                scale=3,
                anchor_point=(0.5, 0.5),
                anchored_position=(120, 120)
            )
        self.grupo_alerta.append(self.alert_label)
        
        self.is_red = True
        self.frame_count = 0

    async def tocar_sirene(self, duracao=3):
        """Toca a sirene por 3 segundos"""
        print("=== SIRENE ATIVADA - PAUSANDO OUTROS PROCESSOS ===")
        self.sirene_ativa = True
        
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
        self.sirene_ativa = False
        print("=== SIRENE FINALIZADA - RETOMANDO PROCESSOS ===")

    async def monitorar_botao(self):
        """Monitora o botão para todas as funções"""
        while True:
            # Verificar tap duplo para iniciar medição
            if self.verificar_tap_duplo():
                print("👆 Tap duplo detectado")
                if not self.alarme:
                    self.alarme = True
                    self.fase_alarme = "som"
                    self.alert_label.text = 'QUEDA!'
                    self.alert_label.color = 0xFFFFFF
                    self.display.root_group = self.grupo_alerta
                    print(" Alarme ativado manualmente via botao")
                    payload = {"x": rtc.RTC().datetime.tm_hour, "y": rtc.RTC().datetime.tm_min, "z": rtc.RTC().datetime.tm_sec, "fall": True}
                    await self.enviar_alarme_backend(payload)
                else:
                    self.alarme = False
                    self.buzzer.duty_cycle = 0
                    self.animacao_ativa = False
                    self.fase_alarme = "inicial"
                    self.sirene_ativa = False
                    self.display.root_group = self.grupo_relogio
                    print(" Alarme desativado via botao")
                await asyncio.sleep(1)
            await asyncio.sleep(0.05)
            
    async def tocar_ton(self, frequencia, duracao):
        """Toca um tom específico usando PWM"""
        return ### Para não fazer barulho algum
        if self.sirene_ativa:
            self.buzzer.frequency = frequencia
            self.buzzer.duty_cycle = 2**14
            await asyncio.sleep(duracao/2)
            self.buzzer.duty_cycle = 0
        else:
            self.buzzer.frequency = frequencia
            self.buzzer.duty_cycle = 2**15
            await asyncio.sleep(duracao)
            self.buzzer.duty_cycle = 0

    async def controlar_alarme(self):
        """Controla a sequência do alarme: sirene por 3s, depois animação"""
        while True:
            if self.alarme and self.fase_alarme == "som":
                print(" Iniciando fase de sirene do alarme")
                await self.tocar_sirene(3)
                
                if self.alarme:
                    self.fase_alarme = "animacao"
                    self.animacao_ativa = True
                    print(" Iniciando fase de animacao do alarme")
                    self.alarme_para_thingspeak = 1
                
            await asyncio.sleep(0.01)

    
    async def animar_alerta(self):
        """Animação do alerta no display MELHORADA"""
        tempo_inicio = 0
        
        while True:
            if self.sirene_ativa:
                await asyncio.sleep(0.1)
                continue
                
            if self.animacao_ativa and self.alarme:
                if tempo_inicio == 0:
                    tempo_inicio = time.monotonic()
                
                self.frame_count += 1
                
                # ALERTA VISUAL MELHORADO
                if self.frame_count % 5 == 0:
                    if self.is_red:
                        self.alerta_palette[0] = 0xFF0000
                        self.alert_label.text = "QUEDA!"
                        self.alert_label.color = 0xFFFFFF
                    else:
                        self.alerta_palette[0] = 0x000000
                        self.alert_label.text = "QUEDA!"
                        self.alert_label.color = 0xFF0000
                    self.is_red = not self.is_red
                
                # 5 segundos de duração
                if time.monotonic() - tempo_inicio >= 10:
                    self.alarme = False
                    self.buzzer.duty_cycle = 0
                    self.animacao_ativa = False
                    self.fase_alarme = "inicial"
                    self.sirene_ativa = False
                    self.display.root_group = self.grupo_relogio
                    print(' Alarme desativado apos 5 segundos')
                    tempo_inicio = 0
                    self.frame_count = 0
                
                await asyncio.sleep(0.1)
            else:
                tempo_inicio = 0
                self.frame_count = 0
                await asyncio.sleep(0.1)

    async def relogio(self):
        """Exibe e atualiza o relógio no display"""
        ultima_atualizacao = 0
        
        while True:
            if self.sirene_ativa:
                await asyncio.sleep(0.1)
                continue
                
            tempo_atual = time.monotonic()
            if tempo_atual - ultima_atualizacao >= 1.0 and not self.alarme:
                self.now = time.localtime()
                if self.now.tm_sec % 2:
                    current_time = "{:02}.{:02}".format(self.now.tm_hour, self.now.tm_min)
                else:
                    current_time = "{:02}'{:02}".format(self.now.tm_hour, self.now.tm_min)
                self.clock_label.text = current_time
                ultima_atualizacao = tempo_atual
            
            await asyncio.sleep(0.1)

    async def detectar_queda(self):
        """Detecta quedas usando o acelerômetro LIS3DH - CORRIGIDO"""
        em_queda_livre = False
        
        while True:
            if self.sirene_ativa:
                await asyncio.sleep(0.5)
                continue
                
            try:
                if self.alarme:
                    await asyncio.sleep(0.5)
                    continue
                
                x, y, z = [value / STANDARD_GRAVITY for value in self.lis3dh.acceleration]
                accel_total = (x**2 + y**2 + z**2)**0.5
                
                if not em_queda_livre:
                    if accel_total < self.FREE_FALL_THRESHOLD:  
                        self.sample_count += 1
                        if self.sample_count >= self.CONSECUTIVE_SAMPLES:
                            em_queda_livre = True
                            print(f"FASE 1: Queda livre detectada (SVM: {accel_total:.2f}g)")
                    else:
                        self.sample_count = 0
                else:
                    if accel_total > self.IMPACT_THRESHOLD:
                        print(f" FASE 2: Impacto detectado! (SVM: {accel_total:.2f}g)")
                        if not self.alarme:
                            agora = time.monotonic()
                            if agora - self.ultima_queda_detectada >= self.intervalo_minimo_queda:
                                self.ultima_queda_detectada = agora
                                print(f" QUEDA DETECTADA! Aceleracao: {accel_total:.2f}G")
                                payload = {"x": x, "y": y, "z":z, "fall": True}
                                await self.enviar_alarme_backend(payload)
                                self.alarme = True
                                self.fase_alarme = "som"
                                self.display.root_group = self.grupo_alerta
                            else:
                                print("Queda ignorada - intervalo muito curto")
                        em_queda_livre = False
                        self.sample_count = 0
                    
                    elif accel_total > (self.FREE_FALL_THRESHOLD + 0.3):
                        print("FALSO POSITIVO: Queda livre sem impacto. Resetando.")
                        em_queda_livre = False
                        self.sample_count = 0
                        
                await asyncio.sleep(self.SAMPLE_INTERVAL)
                
            except Exception as e:
                print(f"Erro na deteccao de queda: {repr(e)}")
                await asyncio.sleep(1)

    async def enviar_dados_thingspeak(self):
        """Envia dados periódicos do acelerômetro"""
        while True:
            if self.sirene_ativa:
                await asyncio.sleep(5)
                continue
                
            try:
                if self.alarme:
                    await asyncio.sleep(5)
                    continue
                    
                tempo_atual = time.monotonic()
                if tempo_atual - self.ultimo_envio_thingspeak >= self.intervalo_thingspeak:
                    
                    if self.wifi_conectado:
                        if not wifi.radio.ipv4_address or "0.0.0.0" in repr(wifi.radio.ipv4_address):
                            self._conectar_wifi()
                        
                        if self.wifi_conectado:
                            x, y, z = (value / STANDARD_GRAVITY for value in self.lis3dh.acceleration)
                            field4 = 1 if self.alarme_para_thingspeak else 0
                            
                            get_url = f"{self.API_URL}/update?api_key={self.tswriteAPI}&field1={x:.2f}&field2={y:.2f}&field3={z:.2f}&field4={field4}"
                            
                            try:
                                r = self.requests.get(get_url)
                                print(f" Dados enviados - X: {x:.2f}G, Y: {y:.2f}G, Z: {z:.2f}G")
                                r.close()
                                
                                self.led_thing.value = True
                                await asyncio.sleep(0.1)
                                self.led_thing.value = False
                                
                                self.ultimo_envio_thingspeak = tempo_atual
                                self.alarme_para_thingspeak = 0
                                gc.collect()
                                
                            except Exception as e:
                                print(f" Erro ao enviar para ThingSpeak: {repr(e)}")
                                if 'r' in locals():
                                    r.close()
                                self.wifi_conectado = False
                    
                    if tempo_atual % 120 < 1:
                        print(f"Memoria: {gc.mem_free()} bytes livres")
                
                await asyncio.sleep(3)
            
            except Exception as e:
                print(f" Erro geral no ThingSpeak: {repr(e)}")
                await asyncio.sleep(5)

    async def verificar_wifi(self):
        """Verifica periodicamente a conexão WiFi"""
        while True:
            if self.sirene_ativa:
                await asyncio.sleep(0.1)
                continue
                
            try:
                if not self.wifi_conectado:
                    self._conectar_wifi()
                    self.acertar_relogio()
                    self.wifi_label.text = ''
                elif not wifi.radio.ipv4_address or "0.0.0.0" in repr(wifi.radio.ipv4_address):
                    print(" Conexao WiFi perdida")
                    self.wifi_conectado = False
                    self.wifi_label.text = ''
                else:
                    self.wifi_label.text = 'Wifi'
                    
            except Exception as e:
                self.wifi_conectado = False
                self.wifi_label.text = ''
                
            await asyncio.sleep(30)

async def main():
        sistema = SistemaAlarme('dc:b4:d9:8b:6c:f0')
        
        tasks = [
            asyncio.create_task(sistema.mqtt_loop()),
            asyncio.create_task(sistema.monitorar_botao()),
            asyncio.create_task(sistema.controlar_alarme()),
            asyncio.create_task(sistema.verificar_wifi()),
            asyncio.create_task(sistema.relogio()),
            asyncio.create_task(sistema.animar_alerta()),
            asyncio.create_task(sistema.detectar_queda()),
            asyncio.create_task(sistema.enviar_dados_thingspeak()),
        ]
        
        try:
            await asyncio.gather(*tasks)
        except Exception as e:
            print(f"Erro nas tarefas: {repr(e)}")
            reset()

if  __name__ == 'vesta_watch_17_10' or __name__ =='__main__':
    try:
        asyncio.run(main())
        pass
    except KeyboardInterrupt:
        print(" Programa interrompido pelo usuário")
    except Exception as e:
        print(f" Erro fatal: {repr(e)}")
        time.sleep(3)	



