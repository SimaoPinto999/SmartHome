#include <WiFi.h>
#include <MQTT.h>
#include <MPU9250_WE.h>
#include <Wire.h>
#include "credentials.h"
#include <math.h> // Necessário para a função pow()


MPU6500_WE myMPU9250 = MPU6500_WE(0x68);

// criacao de queue ao inves de semaforo
typedef struct {
  char topico[64];
  char mensagem[32];
} PacoteMQTT;

QueueHandle_t filaMQTT;

// Pinos
#define PIN_RED     4
#define PIN_GREEN   3
#define PIN_BLUE    2
#define PIN_LDR     0
#define PIN_MOTION  1

//valores para calculo ldr
const float VCC = 3.3;             // Tensão do ESP32
const float ADC_MAX = 4095.0;      // Resolução do ESP32
const float R_DIVISOR = 10000.0;   // Resistor fixo (assumindo 10k ohms)

//caracteristicas tipicas
const float LDR_R10 = 50.0;        // Resistência a 10 Lux (kilo-ohms)
const float LDR_GAMMA = 0.7;       // Inclinação da curva logarítmica

unsigned long last_motion_time = 0;
bool motion_detected = false;

// Configurações Wi-Fi
const char* ssid     = SSID;
const char* password = PASSWORD;

// Configurações MQTT
const char* mqtt_server   = local_ip;
const int   mqtt_port     = MQTT_PORT;
const char* mqtt_user     = MQTT_USER;
const char* mqtt_pass     = MQTT_PASS;
const char* topico_sensor = "home/1/living/temp";
const char* topico_led_set= "home/1/bedroom/led/set";
const char* topico_luz    = "home/1/garden/lux";

WiFiClient   espClient;
MQTTClient   client(1024);

void messageReceived(String &topic, String &msg) {
  Serial.println("Recebido: [" + topic + "] " + msg);

  if (msg == "ON") {
    analogWrite(PIN_RED,   255);
    analogWrite(PIN_GREEN, 255);
    analogWrite(PIN_BLUE,  255);
    client.publish("home/1/bedroom/led", "ON", false, 1);
  } else if (msg == "OFF") {
    analogWrite(PIN_RED,   0);
    analogWrite(PIN_GREEN, 0);
    analogWrite(PIN_BLUE,  0);
    client.publish("home/1/bedroom/led", "OFF", false, 1);
  } else if (msg.startsWith("#") && msg.length() == 7) {
    long color = strtol(msg.substring(1).c_str(), NULL, 16);
    analogWrite(PIN_RED,   (color >> 16) & 0xFF);
    analogWrite(PIN_GREEN, (color >> 8)  & 0xFF);
    analogWrite(PIN_BLUE,   color        & 0xFF);
    client.publish("home/1/bedroom/led", msg.c_str(), false, 1);
  }
}

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("A ligar a ");
  Serial.println(ssid);
  
  WiFi.mode(WIFI_STA); 
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi ligado. IP: ");
  Serial.println(WiFi.localIP());
}

void reconnect() {
  while (WiFi.status() == WL_CONNECTED && !client.connected()) {
    Serial.print("A tentar ligar ao MQTT...");
    
    // Explicitly configure keepAlive (60s), cleanSession (true), and timeout (5000ms)
    client.setOptions(60, true, 5000);
    
    // Use a clean static client ID combined with a random number to avoid bad characters in MAC
    String clientId = "ESP32Client-Sensor1-" + String(random(0xffff), HEX);
    
    if (client.connect(clientId.c_str(), mqtt_user, mqtt_pass)) {
      Serial.println("Ligado!");
      client.subscribe(topico_led_set, 1);
    } else {
      Serial.print("Falhou (Error: ");
      Serial.print(client.lastError());
      Serial.print(", ReturnCode: ");
      Serial.print(client.returnCode());
      Serial.println("), a tentar novamente em 5 segundos");
      
      // Crucial: forcefully close the underlying TCP socket to flush garbage bytes!
      client.disconnect();
      espClient.stop(); 
      delay(5000);
    }
  }
}

//tasks sensores, apenas metem na fila

void taskLDR(void *pvParameters) {
  (void) pvParameters;
  for (;;) {
    int ldrRaw = analogRead(PIN_LDR);
    float lux = 0.0;

    //converter ADC para tensao
    float voltagem = ((float)ldrRaw / ADC_MAX) * VCC;

    //evita divisão por zero se a leitura for 0 ou exatamente o VCC máximo
    if (voltagem > 0.0 && voltagem < VCC) {
        
      //converter tensao para resistencia do LDR
      float resistenciaLDR = R_DIVISOR * (voltagem / (VCC - voltagem));

      //converter Resistência para Lux
      lux = pow((LDR_R10 * 1000.0 * pow(10, LDR_GAMMA)) / resistenciaLDR, (1.0 / LDR_GAMMA));
    }

    PacoteMQTT p;
    strcpy(p.topico, topico_luz);
    
    //formatar
    dtostrf(lux, 4, 2, p.mensagem);
    
    //envio
    xQueueSend(filaMQTT, &p, portMAX_DELAY);
    
    Serial.print("Raw: ");
    Serial.print(ldrRaw);
    Serial.print(" | Volts: ");
    Serial.print(voltagem);
    Serial.print(" | Lux Calculado: ");
    Serial.println(lux);
    
    vTaskDelay(pdMS_TO_TICKS(10000));
  }
}

void taskMotion(void *pvParameters) {
  (void) pvParameters;
  for (;;) {
    unsigned long now = millis();
    if (digitalRead(PIN_MOTION) == HIGH) {
      last_motion_time = now;
      if (!motion_detected) {
        motion_detected = true;
        PacoteMQTT p;
        strcpy(p.topico, "home/1/bedroom/motion");
        strcpy(p.mensagem, "ON");
        xQueueSend(filaMQTT, &p, portMAX_DELAY);
        Serial.println("Motion ON enviado para a fila.");
      }
    } else {
      if (motion_detected && (now - last_motion_time > 5000)) {
        motion_detected = false;
        PacoteMQTT p;
        strcpy(p.topico, "home/1/bedroom/motion");
        strcpy(p.mensagem, "OFF");
        xQueueSend(filaMQTT, &p, portMAX_DELAY);
        Serial.println("Motion OFF enviado para a fila.");
      }
    }
    vTaskDelay(pdMS_TO_TICKS(500));
  }
}

void taskTemp(void *pvParameters) {
  (void) pvParameters;
  for (;;) {
    float temp = myMPU9250.getTemperature();
    if (!isnan(temp)) {
      PacoteMQTT p;
      strcpy(p.topico, topico_sensor);
      dtostrf(temp, 1, 2, p.mensagem);
      xQueueSend(filaMQTT, &p, portMAX_DELAY);
      Serial.println("Temperatura enviada para a fila.");
    }
    vTaskDelay(pdMS_TO_TICKS(5000));
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_LDR,   INPUT);
  pinMode(PIN_RED,   OUTPUT);
  pinMode(PIN_GREEN, OUTPUT);
  pinMode(PIN_BLUE,  OUTPUT);
  pinMode(PIN_MOTION, INPUT);

  Wire.begin(8, 9);
  if (!myMPU9250.init()) {
    Serial.println("MPU9250 does not respond");
  }

  //criacao fila para 10 msg
  filaMQTT = xQueueCreate(10, sizeof(PacoteMQTT));

  setup_wifi();
  
  IPAddress serverIP;
  if (serverIP.fromString(mqtt_server)) {
    client.begin(serverIP, mqtt_port, espClient);
  } else {
    client.begin(mqtt_server, mqtt_port, espClient);
  }
  
  client.onMessage(messageReceived);

  //inicio tasks sensores
  xTaskCreate(taskMotion, "taskMotion", 3072, NULL, 1, NULL);
  xTaskCreate(taskTemp,   "taskTemp",   3072, NULL, 1, NULL);
  xTaskCreate(taskLDR,    "taskLDR",    3072, NULL, 1, NULL);
}

//loop principal gere a rede
void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    return;
  }

  if (!client.connected()) {
    reconnect();
  }
  
  client.loop(); //mantem mqtt vivo

  //se estivermos ligados, esvaziamos a Fila de Mensagens
  if (client.connected()) {
    PacoteMQTT p;
    //tenta receber uma mensagem da fila. nao bloqueia (0 ticks de espera)
    if (xQueueReceive(filaMQTT, &p, 0) == pdTRUE) {
      Serial.print("A publicar via Fila -> ");
      Serial.print(p.topico);
      Serial.print(": ");
      Serial.println(p.mensagem);
      client.publish(p.topico, p.mensagem, false, 1);
    }
  }
}