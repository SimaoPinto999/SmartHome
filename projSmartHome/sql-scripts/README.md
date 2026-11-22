# SQL Scripts

Scripts de inicialização automática da base de dados PostgreSQL.

| Ficheiro | Descrição |
|----------|-----------|
| `DDL.sql` | Criação das tabelas e índices |
| `DML.sql` | Dados de teste iniciais |

---

## Verificar se os dados estão carregados

### 1. Entrar no container

```bash
docker exec -it smarthome_db psql -U postgres -d smarthome
```

### 2. Queries de verificação

**Tabelas existentes:**
```sql
\dt
```

**Contas (deve ter 1):**
```sql
SELECT accountId, email, createdAt FROM Account;
```

**Perfis (deve ter 2 — ADMIN e GUEST):**
```sql
SELECT profileId, firstName, lastName, role FROM Profile;
```

**Casa (deve ter 1):**
```sql
SELECT houseId, houseName, address FROM House;
```

**Divisões (deve ter 6):**
```sql
SELECT roomId, roomName, roomType, floor FROM Room;
```

**Dispositivos (deve ter 9):**
```sql
SELECT deviceId, deviceName, deviceType, status FROM Device;
```

**Componentes (deve ter 10):**
```sql
SELECT componentId, deviceId, componentName, componentType FROM DeviceComponent;
```

**Permissões (deve ter 6):**
```sql
SELECT permissionId, profileId, roomId, permissionLevel FROM Permission;
```

**Logs de estado (deve ter 3):**
```sql
SELECT logId, deviceId, statusValue, timestamp FROM DeviceStatusLog;
```

---

## Notas

Para sair do psql:
```bash
\q
```
---

> Os scripts só correm **uma vez**, na primeira inicialização do container (quando o volume `postgres_data` está vazio).

Para forçar uma reinicialização limpa:

```bash
docker compose down -v
docker compose up
```
