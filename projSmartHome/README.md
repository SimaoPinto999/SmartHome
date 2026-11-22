# SmartHome — Docker Commands

## First time / clean start

```bash
cp .env.example .env   # valores de desenvolvimento local
docker compose up -d --build
```

Aplicação: http://localhost:3000 · Authentik: http://localhost:9090
As contas de demonstração estão em `.env.example` (`DEMO_*`).

> **Authentik:** a aplicação, o provider OIDC e as contas de demonstração são criados no primeiro arranque pelo blueprint [`blueprints/smarthome.yaml`](blueprints/smarthome.yaml) (demora ~1-2 min). O admin é o `akadmin`, com a password `DEMO_ADMIN_PASSWORD`.
>
> **Login com Google/GitHub (opcional):** não vem configurado. Cria as tuas apps OAuth e adiciona-as em Authentik → Directory → Federation & Social login.
>
> **Já correste o projeto antes?** O Postgres e o Authentik guardam as passwords nos volumes. Se mudares o `.env`, corre `docker compose down -v` primeiro (apaga os dados locais).
---

## After changing backend code (Java)

```bash
docker compose up -d --build backend
```

---

## After changing SQL scripts (DDL.sql / DML.sql)

The init scripts only run when the database volume is created for the first time.
To apply changes, the volume must be removed:

```bash
docker compose down -v
docker compose up -d --build
```

> **Warning:** `-v` deletes all database data permanently.

---

## After changing frontend code

```bash
docker compose up -d --build frontend
```

---

## Stop everything (keep data)

```bash
docker compose down
```

## Stop everything and delete all data

```bash
docker compose down -v
```

---

## View logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f postgres
docker compose logs -f frontend
```

---

## Services

| Service           | URL                      |
|-------------------|--------------------------|
| Backend           | http://localhost:8081    |
| Frontend          | http://localhost:3000    |
| Postgres          | localhost:5432           |
| RabbitMQ (AMQP)   | localhost:5672           |
| RabbitMQ (UI)     | http://localhost:15672   |
| InfluxDB          | http://localhost:8086    |

---

# Virtual sensors

```bash
python3 venv .venv
source .venv/bin/activate
pip install -r "requirements.txt"
python3 simulator.py
```


# Real Sensor

## pré-requisitos

verificar o IP local do computador host e abrir o porto do MQTT:

````bash
ip a | grep 192          # verificar IP local
sudo ufw allow 1883/tcp  # permitir ligações no porto MQTT
` ``

## Configuração

1. Abre o ficheiro `credentials.h.example` e preenche os campos:

```cpp
#define SSID     "nome_da_rede"
#define PASSWORD "palavra_passe"
#define LOCAL_IP "192.168.1.X"  // IP obtido no passo anterior
` ``

2. Renomeia o ficheiro para `credentials.h`
```