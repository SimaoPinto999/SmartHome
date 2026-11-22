# pyrefly: ignore [missing-import]
import paho.mqtt.client as mqtt
import os
import time
import random
import threading
import datetime
import requests
from zoneinfo import ZoneInfo

# Configuration

MQTT_HOST  = os.environ.get("MQTT_HOST", "localhost")
MQTT_PORT  = int(os.environ.get("MQTT_PORT", "1883"))
MQTT_USER  = os.environ.get("MQTT_USER", "guest")
MQTT_PASS  = os.environ.get("MQTT_PASS", "guest")

API_URL = os.environ.get("API_URL", "http://backend:8081/api/device-components/all")
MAX_PUBLICATIONS = int(os.environ.get("MAX_PUBLICATIONS", "300"))

TZ_NAME = os.environ.get("TZ", "UTC")
try:
    LOCAL_TZ = ZoneInfo(TZ_NAME)
except Exception:
    LOCAL_TZ = ZoneInfo("UTC")

# Active simulation threads to prevent duplicates. Maps device_id -> threading.Event (stop event)
running_devices = {}
running_devices_lock = threading.Lock()

def simulate_physical_device(device_id: str, components: list, stop_event: threading.Event) -> None:
    print(f"[INIT] Device '{device_id}' with {len(components)} components", flush=True)

    client = mqtt.Client(client_id=f"device_{device_id}")
    client.username_pw_set(MQTT_USER, MQTT_PASS)

    # State tracking per component
    state = {}
    
    for comp in components:
        topic = comp["topic"]
        c_type = comp["type"]
        interval = comp.get("interval", 10)
        
        comp_state = {
            "config": comp,
            "next_publish": time.time() + random.uniform(1, 5), # Stagger initial publish
            "interval": interval,
            "count": 0
        }
        
        if c_type == "thermostat":
            comp_state["current_temp"] = comp.get("initial_temp", 20.0)
            comp_state["setpoint"] = None
        elif c_type == "contact":
            comp_state["value"] = "CLOSED"
            comp_state["time_in_state"] = 0
            comp_state["last_update"] = time.time()
            comp_state["next_change"] = random.randint(*comp["closed_range"])
        elif c_type in ["rgb", "toggle", "actuator"]:
            comp_state["value"] = "#ffffff" if c_type == "rgb" else "OFF"
            
        state[topic] = comp_state

    # Message handler for actuators/thermostats
    def on_message(client, userdata, msg):
        try:
            payload = msg.payload.decode("utf-8").strip()
            topic = msg.topic
            
            if topic.endswith("/set"):
                base_topic = topic[:-4]
                if base_topic in state:
                    comp_state = state[base_topic]
                    c_type = comp_state["config"]["type"]
                    
                    print(f"[{device_id}] Command on {topic}: {payload}", flush=True)
                    
                    if c_type == "thermostat":
                        if payload.upper() == "OFF":
                            comp_state["setpoint"] = None
                        else:
                            comp_state["setpoint"] = float(payload)
                        # Force immediate publish
                        comp_state["next_publish"] = 0
                        
                    elif c_type in ["rgb", "toggle", "actuator"]:
                        comp_state["value"] = payload
                        # Publish ACK immediately
                        comp_state["next_publish"] = 0
                        
        except Exception as e:
            print(f"[{device_id}] Error in on_message: {e}", flush=True)

    client.on_message = on_message

    connected = False
    for attempt in range(1, 11):
        if stop_event.is_set():
            return
        try:
            client.connect(MQTT_HOST, MQTT_PORT, keepalive=60)
            
            # Subscribe to all /set topics
            for comp in components:
                if comp["type"] in ["thermostat", "rgb", "toggle", "actuator"]:
                    client.subscribe(f"{comp['topic']}/set")
                    
            client.loop_start()
            connected = True
            print(f"[OK]   Connected ({MQTT_HOST}:{MQTT_PORT}) for device {device_id}", flush=True)
            
            # Publish initial states for actuators
            for topic, comp_state in state.items():
                if comp_state["config"]["type"] in ["rgb", "toggle", "actuator"]:
                    client.publish(topic, comp_state["value"], qos=1)
                    
            break
        except Exception as e:
            print(f"[WARN] Attempt {attempt}/10 failed for {device_id}: {e} — retrying in 5s", flush=True)
            if stop_event.wait(5):
                return

    if not connected:
        print(f"[ERR]  Could not connect for {device_id}. Giving up.", flush=True)
        return

    # Unified Event Loop
    while not stop_event.is_set():
        now = time.time()
        
        for topic, comp_state in state.items():
            if now >= comp_state["next_publish"]:
                c_type = comp_state["config"]["type"]
                cfg = comp_state["config"]
                payload = None
                
                # Max publications check
                if comp_state["count"] >= MAX_PUBLICATIONS:
                    continue
                
                if c_type == "thermostat":
                    sp = comp_state["setpoint"]
                    if sp is None:
                        comp_state["current_temp"] += max(-0.2, min(0.2, 18.0 - comp_state["current_temp"]))
                        payload = "OFF"
                    else:
                        diff = sp - comp_state["current_temp"]
                        comp_state["current_temp"] += max(-0.4, min(0.4, diff))
                        comp_state["current_temp"] += random.uniform(-0.1, 0.1)
                        comp_state["current_temp"] = round(comp_state["current_temp"], 1)
                        payload = str(comp_state["current_temp"])
                        
                elif c_type == "contact":
                    elapsed = now - comp_state["last_update"]
                    comp_state["last_update"] = now
                    comp_state["time_in_state"] += elapsed
                    
                    if comp_state["time_in_state"] >= comp_state["next_change"]:
                        if comp_state["value"] == "CLOSED":
                            comp_state["value"] = "OPEN"
                            comp_state["next_change"] = random.randint(*cfg["open_range"])
                        else:
                            comp_state["value"] = "CLOSED"
                            comp_state["next_change"] = random.randint(*cfg["closed_range"])
                        comp_state["time_in_state"] = 0
                    
                    payload = comp_state["value"]
                    
                elif c_type in ["rgb", "toggle", "actuator"]:
                    payload = comp_state["value"]
                    
                elif c_type == "temperature":
                    payload = str(round(random.uniform(cfg["min"], cfg["max"]), 1))
                elif c_type == "energy":
                    payload = str(random.randint(cfg["min"], cfg["max"]))
                elif c_type == "percent":
                    payload = str(random.randint(cfg["min"], cfg["max"]))
                elif c_type == "rain":
                    payload = str(round(random.uniform(cfg["min"], cfg["max"]), 1))
                elif c_type == "lux":
                    payload = str(random.randint(cfg["min"], cfg["max"]))
                elif c_type == "motion":
                    payload = "ON" if random.random() < 0.1 else "OFF"
                
                if payload is not None:
                    try:
                        client.publish(topic, payload, qos=1)
                        comp_state["count"] += 1
                        ts = datetime.datetime.now(LOCAL_TZ).strftime("%H:%M:%S")
                        print(f"[{ts}] [{comp_state['count']}/{MAX_PUBLICATIONS}] {device_id} ({c_type}) → {topic}: {payload}", flush=True)
                    except Exception as e:
                        print(f"[{device_id}] Publish error for {topic}: {e}", flush=True)
                        
                comp_state["next_publish"] = now + comp_state["interval"]

        # Sleep for 1 second, checking stop_event
        stop_event.wait(1.0)
        
    print(f"[DONE] Device {device_id} finished. Stopping MQTT client.", flush=True)
    client.loop_stop()
    client.disconnect()
    
    with running_devices_lock:
        if device_id in running_devices and running_devices[device_id]["stop_event"] == stop_event:
            del running_devices[device_id]


def map_api_component(comp: dict) -> dict:
    c_type = comp.get("componentType")
    s_type = comp.get("sensorType")
    a_type = comp.get("actuatorType")
    unit = comp.get("unit")
    topic = comp.get("mqttTopic")
    
    if not topic:
        return None

    if c_type == "SENSOR":
        if s_type == "TEMPERATURE":
            return {"topic": topic, "type": "temperature", "min": 18.0, "max": 25.0, "interval": random.randint(5, 15)}
        elif s_type == "POWER":
            return {"topic": topic, "type": "energy", "min": 100, "max": 3000, "interval": random.randint(5, 15)}
        elif s_type == "SMOKE":
            return {"topic": topic, "type": "percent", "min": 0, "max": 5, "interval": random.randint(5, 15)}
        elif s_type == "RAIN":
            return {"topic": topic, "type": "rain", "min": 0.0, "max": 15.0, "interval": random.randint(5, 15)}
        elif s_type == "LIGHT":
            return {"topic": topic, "type": "lux", "min": 0, "max": 10000, "interval": random.randint(5, 15)}
        elif s_type == "CONTACT":
            return {"topic": topic, "type": "contact", "closed_range": (120, 480), "open_range": (30, 120), "interval": 30}
        elif s_type == "MOTION":
            return {"topic": topic, "type": "motion", "interval": random.randint(5, 15)}
    elif c_type == "ACTUATOR":
        if a_type == "HVAC" and unit == "CELSIUS":
            return {"topic": topic, "type": "thermostat", "initial_temp": 20.0, "interval": 5}
        elif unit == "RGB":
            return {"topic": topic, "type": "rgb", "is_actuator": True, "interval": 30}
        elif unit == "BINARY":
            return {"topic": topic, "type": "toggle", "is_actuator": True, "interval": 30}
        else:
            return {"topic": topic, "type": "toggle", "is_actuator": True, "interval": 30}
    return None


def poll_api_and_spawn_threads():
    while True:
        try:
            print(f"[POLL] Fetching components from {API_URL}...", flush=True)
            response = requests.get(API_URL, timeout=10)
            if response.status_code == 200:
                components = response.json()
                api_devices = set()
                device_groups = {}
                
                # Group components by deviceId
                for comp in components:
                    device_id = comp.get("deviceId")
                    topic = comp.get("mqttTopic")
                    if not device_id or not topic:
                        continue
                        
                    api_devices.add(device_id)
                    
                    if device_id not in device_groups:
                        device_groups[device_id] = []
                    
                    dev_mapped = map_api_component(comp)
                    if dev_mapped:
                        device_groups[device_id].append(dev_mapped)
                
                # Create threads for new or modified devices
                for device_id, devs in device_groups.items():
                    start_new_thread = False
                    
                    with running_devices_lock:
                        if device_id not in running_devices:
                            start_new_thread = True
                        else:
                            # Check if the components changed by comparing their sorted topics
                            current_topics = sorted([c["topic"] for c in running_devices[device_id]["components"]])
                            new_topics = sorted([c["topic"] for c in devs])
                            if current_topics != new_topics:
                                print(f"[POLL] Device {device_id} components changed! Restarting device thread.", flush=True)
                                running_devices[device_id]["stop_event"].set()
                                start_new_thread = True
                    
                    if start_new_thread:
                        stop_event = threading.Event()
                        with running_devices_lock:
                            running_devices[device_id] = {
                                "stop_event": stop_event,
                                "components": devs
                            }
                        
                        t = threading.Thread(
                            target=simulate_physical_device,
                            args=(device_id, devs, stop_event),
                            daemon=True,
                        )
                        t.start()
                        time.sleep(1) # Stagger
                
                #check for devices that were removed
                with running_devices_lock:
                    devices_to_stop = []
                    for device_id in running_devices:
                        if device_id not in api_devices:
                            devices_to_stop.append(device_id)
                    
                    for device_id in devices_to_stop:
                        print(f"[POLL] Device {device_id} no longer exists in API. Signalling stop.", flush=True)
                        running_devices[device_id]["stop_event"].set() # Signal the stop event

            else:
                print(f"[POLL] Error fetching components: HTTP {response.status_code}", flush=True)
        except Exception as e:
            print(f"[POLL] Exception during API polling: {e}", flush=True)
            
        # Poll every 30 seconds
        time.sleep(30)

# Entry point
if __name__ == "__main__":
    print("\n[START] Starting API Poller for Virtual Sensors Simulator...", flush=True)
    poll_api_and_spawn_threads()