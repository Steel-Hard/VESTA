import time
import board
import busio
import adafruit_lis3dh
from adafruit_lis3dh import LIS3DH_I2C, RANGE_2_G
import ssl
import wifi
import socketpool
import adafruit_requests
import os
from adafruit_datetime import datetime
from microcontroller import reset
import digitalio
from adafruit_debouncer import Button
import asyncio

# --- Configuração do LED ---
# led = digitalio.DigitalInOut(board.IO2)
# led.direction = digitalio.Direction.OUTPUT
# led.value = False

# --- Configuração do Botão ---
pin = digitalio.DigitalInOut(board.IO3)
pin.direction = digitalio.Direction.INPUT
pin.pull = digitalio.Pull.UP
botao = Button(pin)

# --- Configuração do Sensor LIS3DH ---
spi = board.SPI()
cs = digitalio.DigitalInOut(board.IO21)
lis3dh = adafruit_lis3dh.LIS3DH_SPI(spi, cs)
lis3dh.range = adafruit_lis3dh.RANGE_2_G

# Get wifi and thingspeak write API details from a settings.toml file
print(os.getenv("test_env_file"))
ssid = os.getenv("WIFI_SSID")
password = os.getenv("WIFI_PASSWORD")

# --- Parâmetros para Detecção de Queda ---
FREE_FALL_THRESHOLD = 0.4
CONSECUTIVE_SAMPLES = 6
SAMPLE_INTERVAL = 0.05
sample_count = 0

# --- Variáveis Compartilhadas ---
alarme = False
queda = 1

async def blink_control(pin, interval_segundos=0.5):
    """
    Corrotina para piscar o LED apenas quando alarme = True
    """
    with digitalio.DigitalInOut(pin) as led:
        led.switch_to_output()
        led_estado = False
        ultimo_tempo = time.monotonic()
        
        while True:
            atual = time.monotonic()
            
            if alarme:
                # Verifica se é hora de piscar
                if atual - ultimo_tempo >= interval_segundos:
                    led_estado = not led_estado
                    led.value = led_estado
                    ultimo_tempo = atual
            else:
                # Se não há alarme, mantém LED apagado
                if led_estado:
                    led_estado = False
                    led.value = False
            
            # Importante: yield para outras tarefas
            await asyncio.sleep(0.01)

async def verificar_botao():
    """
    Corrotina para verificar o botão continuamente
    """
    global alarme
    
    while True:
        botao.update()
        
        if botao.long_press and alarme:
            alarme = False
            print("Alarme desativado pelo botão")
        
        await asyncio.sleep(0.01)

async def monitorar_acelerometro():
    """
    Corrotina principal para monitorar o acelerômetro
    """
    global alarme, sample_count, queda
    
    while True:
        try:
            # Ler os valores de aceleração e converter para Gs
            x, y, z = [value / adafruit_lis3dh.STANDARD_GRAVITY for value in lis3dh.acceleration]
                  
            # Calcular a aceleração total (magnitude do vetor)
            acceleration_magnitude = (x**2 + y**2 + z**2)**0.5
            
            # Verificar condição de queda
            if acceleration_magnitude < FREE_FALL_THRESHOLD:
                sample_count += 1
                print(f'amostra: {sample_count} - {acceleration_magnitude:.3f}')
                if sample_count >= CONSECUTIVE_SAMPLES:
                    print(f"🚨 Queda detectada! - {queda}")
                    sample_count = 0
                    print(datetime.now())
                    print(f"Threshold: {FREE_FALL_THRESHOLD}")
                    print(f"Amostras: {CONSECUTIVE_SAMPLES}")
                    alarme = True
                    print("Alarme ATIVADO")
                    queda += 1  
            else:
                sample_count = 0  # Resetar se a leitura sair do limiar
            
            await asyncio.sleep(SAMPLE_INTERVAL)
            
        except Exception as e:
            print(f"Erro no acelerômetro: {e}")
            await asyncio.sleep(1)

async def carregar_configuracoes():
    """
    Corrotina para carregar configurações remotas
    """
    global FREE_FALL_THRESHOLD, CONSECUTIVE_SAMPLES, SAMPLE_INTERVAL
    
    try:
        wifi.radio.connect(ssid, password)
        pool = socketpool.SocketPool(wifi.radio)
        requests = adafruit_requests.Session(pool, ssl.create_default_context())
        
        response = requests.get("http://ladeira.cc/settings.json")
        remote_settings = response.json()
        
        # Atualize os parâmetros com os valores do arquivo remoto
        FREE_FALL_THRESHOLD = remote_settings.get("free_fall_threshold", FREE_FALL_THRESHOLD)
        CONSECUTIVE_SAMPLES = remote_settings.get("consecutive_samples", CONSECUTIVE_SAMPLES)
        SAMPLE_INTERVAL = remote_settings.get("sample_interval", SAMPLE_INTERVAL)
        print("Configurações carregadas com sucesso!")
        
    except Exception as e:
        print("Erro ao carregar configurações. Usando valores padrão.", e)

async def main():
    """
    Função principal que executa todas as tarefas concurrentemente
    """
    # Carrega configurações (opcional: pode ser uma tarefa separada)
    await carregar_configuracoes()
    
    # Cria todas as tarefas
    tarefas = [
        asyncio.create_task(blink_control(board.IO2, 0.5)),
        asyncio.create_task(verificar_botao()),
        asyncio.create_task(monitorar_acelerometro()),
    ]
    
    # Executa todas as tarefas concurrentemente
    await asyncio.gather(*tarefas)

# Inicia o programa assíncrono
try:
    asyncio.run(main())
except Exception as e:
    print(f"Erro crítico: {e}")
    reset()
