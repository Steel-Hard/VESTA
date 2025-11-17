import os
import ssl
import wifi
import socketpool
import adafruit_requests as requests
import adafruit_minimqtt.adafruit_minimqtt as MQTT 
import time
import json
from secrets import secrets
from microcontroller import reset

# --- 1. CONFIGURAÇÃO GERAL ---
MQTT_TOPIC = f"{secrets['mqtt_user']}/meu_topico"
# URL do OnRender com HTTPS
ONRENDER_URL = 'https://vesta-xyil.onrender.com/device/metric/691509ff87058ba549b905b0'


# --- 2. FUNÇÕES AUXILIARES ---

def parse_accelerometer_data(payload_str):
    """
    Converte a string de dados do ESP32 (ex: 'SVM:..., X:..., Y:..., Z:...')
    em um dicionário Python para o POST JSON.
    """
    data = {"x": 0.0, "y": 0.0, "z": 0.0, "fall": False}
    
    try:
        parts = payload_str.split(', ')
        
        for part in parts:
            if ':' in part:
                key, value = part.split(':')
                key = key.strip()
                
                if key in ['X', 'Y', 'Z']:
                    data[key.lower()] = float(value)
                
                if "ALARME: 1" in payload_str or "Queda".upper() in payload_str:
                    data["fall"] = True
                else:
                    data["fall"] = False

    except Exception as e:
        print(f" Erro ao analisar payload: {e}. Usando dados padrão.")
        data = {"x": 0.0, "y": 0.0, "z": 0.0, "fall": False}
        
    return data


def post_to_onrender(payload_str):
    """
    Executa a requisição HTTPS POST para o servidor OnRender.
    Esta função é chamada quando uma mensagem MQTT é recebida.
    """
    print(f"--------------------------------------------------------")
    
    # 1. Converte a string MQTT para o formato JSON do OnRender
    post_payload = parse_accelerometer_data(payload_str)
    
    print(f" Payload preparado para POST: {post_payload}")

    # 2. Faz o HTTPS POST
    try:
        if 'QUEDA DETECTADA' in payload_str.upper():
            # A sessão de requests AINDA USA SSL/TLS para o HTTPS POST
            response = requests_session.post(
                ONRENDER_URL, 
                json=post_payload,
                headers={'Content-Type': 'application/json'}
            )
            
            print(f"↩ HTTPS POST ENVIADO. Status: {response.status_code}")
            
            # 3. Mostra a resposta do site
            if response.status_code == 200 or response.status_code == 201:
                try:
                    print(" Resposta JSON do Site:", response.json())
                except Exception:
                    print(" Resposta de texto do Site:", response.text)
            else:
                print(f" Erro HTTP no Site. Resposta: {response.text}")

            response.close()

    except Exception as e:
        print(f" ERRO DE CONEXÃO ou REQUISIÇÃO HTTPS: {e}")
    
    print(f"========================================================")


# --- 3. CALLBACKS MQTT ---

def connected(client, userdata, flags, rc):
    """Chamado quando a conexão MQTT é bem-sucedida."""
    print(f" MQTT Conectado. Subscrevendo a {MQTT_TOPIC}")
    client.subscribe(MQTT_TOPIC)

def disconnected(client, userdata, rc):
    """Chamado quando o cliente MQTT se desconecta."""
    print(" MQTT Desconectado.")

def message(client, topic, message):
    """
    Chamado quando uma mensagem MQTT é recebida. 
    Este é o gatilho para a requisição HTTPS.
    """
    print(f"\n========================================================")
    print(f" MQTT RECEBIDO em {topic}: {message}")
    
    # Chama a função de POST
    post_to_onrender(message)


# --- 4. INICIALIZAÇÃO E LOOP PRINCIPAL ---

# Conecta ao Wi-Fi
try:
    print(f"Conectando ao Wi-Fi '{secrets['ssid']}'...")
    wifi.radio.connect(secrets['ssid'], secrets['password'])
    print(f" Wi-Fi Conectado! IP: {wifi.radio.ipv4_address}")
except Exception as e:
    print(f" Falha ao conectar ao Wi-Fi: {e}")
    time.sleep(5)
    reset()



# Inicializa o Pool de Sockets e a Sessão de Requisições
pool = socketpool.SocketPool(wifi.radio)

# Cria a sessão de requests. Mantém o contexto SSL aqui pois o POST é HTTPS.
requests_session = requests.Session(pool, ssl.create_default_context())

# Inicializa o Cliente MQTT (porta 1883)
mqtt_client = MQTT.MQTT(
    broker=secrets['mqtt_broker'],
    port=secrets['mqtt_port'], # Deve ser 1883 no secrets.py
    username=secrets['mqtt_user'],
    password=secrets['mqtt_password'],
    socket_pool=pool,
)

# Configura os callbacks
mqtt_client.on_connect = connected
mqtt_client.on_disconnect = disconnected
mqtt_client.on_message = message

print("Tentando conectar ao MQTT...")
mqtt_client.connect()

last_ping = time.monotonic()

while True:
    try:
        mqtt_client.loop()

        if (time.monotonic() - last_ping) >= 60:
            mqtt_client.ping()
            last_ping = time.monotonic()

    except Exception as e:
        print(f" Erro no loop principal (MQTT ou Wi-Fi): {e}")
        time.sleep(5)
        try:
            mqtt_client.reconnect()
        except Exception as e_reconnect:
            print(f" Erro na reconexão: {e_reconnect}")
            time.sleep(5)