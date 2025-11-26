import paho.mqtt.client as mqtt
import requests
import json
import time
import sys
from datetime import datetime

# --- CONFIGURAÇÃO ---
MQTT_BROKER = "maqiatto.com"
MQTT_PORT = 1883
MQTT_USER = "x4cajh8pu@mozmail.com" 
MQTT_PASSWORD = "123"               
MQTT_TOPIC = f"{MQTT_USER}/queda"


ONRENDER_URL = 'https://vesta-xyil.onrender.com/device/metric/691509ff87058ba549b905b0'

# --- VARIÁVEIS GLOBAIS ---
request_session = requests.Session()

# --- FUNÇÃO PARA ENVIAR PARA ONRENDER ---
def post_to_onrender(payload_str):
    print("=" * 60)
    print(f"[{datetime.now().strftime('%H:%M:%S')}] 📨 MQTT Recebido: {payload_str}")
    
    try:
        # Converte string JSON para dicionário
        payload_data = json.loads(payload_str)
        print(f"[{datetime.now().strftime('%H:%M:%S')}] 📤 Enviando para OnRender...")
        
        # Faz a requisição POST
        response = request_session.post(
            ONRENDER_URL,
            json=payload_data,
            headers={'Content-Type': 'application/json'},
            timeout=60
        )
        
        print(f"[{datetime.now().strftime('%H:%M:%S')}] ↩️ Status: {response.status_code}")
        
        if response.status_code in [200, 201]:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] ✅ POST bem sucedido!")
        else:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] ❌ Erro HTTP: {response.text}")
        
    except json.JSONDecodeError as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] ❌ Erro no JSON: {e}")
    except requests.exceptions.Timeout:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] ❌ Timeout na requisição")
    except requests.exceptions.ConnectionError:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] ❌ Erro de conexão")
    except Exception as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] ❌ Erro: {e}")
    
    print("=" * 60)

# --- CALLBACKS MQTT ---
def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] ✅ Conectado ao MQTT Broker!")
        client.subscribe(MQTT_TOPIC)
        print(f"[{datetime.now().strftime('%H:%M:%S')}] 📡 Inscrito no tópico: {MQTT_TOPIC}")
    else:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] ❌ Falha na conexão. Código: {rc}")

def on_disconnect(client, userdata, rc):
    if rc != 0:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] ⚠️ Desconectado inesperadamente. Tentando reconectar...")
    else:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] 🔌 Desconectado normalmente")

def on_message(client, userdata, msg):
    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] 🎯 Nova mensagem MQTT recebida")
    print(f"    Tópico: {msg.topic}")
    post_to_onrender(msg.payload.decode())

# --- CONFIGURAÇÃO MQTT ---
def setup_mqtt():
    client = mqtt.Client()
    client.username_pw_set(MQTT_USER, MQTT_PASSWORD)
    client.on_connect = on_connect
    client.on_disconnect = on_disconnect
    client.on_message = on_message
    
    return client

# --- PROGRAMA PRINCIPAL ---
def main():
    print("🚀 Iniciando Bridge MQTT para HTTP")
    print("=" * 50)
    
    # Configura MQTT
    try:
        mqtt_client = setup_mqtt()
        
        print(f"[{datetime.now().strftime('%H:%M:%S')}] 🔗 Conectando ao broker MQTT..."+MQTT_BROKER)
        mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
        
        print(f"[{datetime.now().strftime('%H:%M:%S')}] 🎯 Iniciando loop MQTT...")
        mqtt_client.loop_forever()
        
    except KeyboardInterrupt:
        print(f"\n[{datetime.now().strftime('%H:%M:%S')}] ⏹️ Programa interrompido pelo usuário")
        mqtt_client.disconnect()
        request_session.close()
        sys.exit(0)
    except Exception as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] 💥 Erro crítico: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()