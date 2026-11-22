#!/bin/bash

BASE_URL="http://localhost:8081/api"
CONTENT_TYPE="Content-Type: application/json"
DEV_ID="DEV-TEST-001"

FAILED=()

# Extrai o valor de um campo numérico do JSON (ex: extract_field "accountId" '{"accountId":5,...}')
extract_field() {
    local field="$1"
    local json="$2"
    echo "$json" | grep -oP "\"${field}\"\s*:\s*\K[0-9]+" | head -1
}

run_test() {
    local label="$1"
    local expected="$2"
    shift 2
    local response status body
    response=$(curl -s -w "\n%{http_code}" "$@")
    status=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    echo "$label"
    echo "  Response: $body"
    echo "  Status:   $status (esperado: $expected)"
    if [ "$status" != "$expected" ]; then
        FAILED+=("$label → HTTP $status (esperado $expected)")
        echo "  [FALHOU]"
    else
        echo "  [OK]"
    fi
    echo ""
    LAST_BODY="$body"
}

echo "A INICIAR TESTES EXAUSTIVOS EM $BASE_URL..."
echo "================================================================="

# ------------------------------------------
# 1. ACCOUNTS (/api/accounts)
# ------------------------------------------
run_test "1.1 POST Account" "201" \
    -X POST "$BASE_URL/accounts" -H "$CONTENT_TYPE" \
    -d '{ "email": "teste@smarthome.pt", "password": "password123" }'
ACCOUNT_ID=$(extract_field "accountId" "$LAST_BODY")
echo "  [Capturado] ACCOUNT_ID=$ACCOUNT_ID"
echo ""

run_test "1.2 GET Todas as Accounts" "200" \
    -X GET "$BASE_URL/accounts"

run_test "1.3 GET Account por ID" "200" \
    -X GET "$BASE_URL/accounts/$ACCOUNT_ID"

run_test "1.4 PUT Account" "200" \
    -X PUT "$BASE_URL/accounts/$ACCOUNT_ID" -H "$CONTENT_TYPE" \
    -d '{ "email": "teste_atualizado@smarthome.pt", "password": "newpassword123" }'

# ------------------------------------------
# 2. PROFILES (/api/profiles)
# ------------------------------------------
run_test "2.1 POST Profile" "201" \
    -X POST "$BASE_URL/profiles" -H "$CONTENT_TYPE" \
    -d '{ "accountId": '"$ACCOUNT_ID"', "firstName": "Rui", "lastName": "Costa", "role": "ADMIN" }'
PROFILE_ID=$(extract_field "profileId" "$LAST_BODY")
echo "  [Capturado] PROFILE_ID=$PROFILE_ID"
echo ""

run_test "2.2 GET Profiles por Account ID" "200" \
    -X GET "$BASE_URL/profiles/account/$ACCOUNT_ID"

run_test "2.3 GET Profile por ID" "200" \
    -X GET "$BASE_URL/profiles/$PROFILE_ID"

run_test "2.4 PUT Profile" "200" \
    -X PUT "$BASE_URL/profiles/$PROFILE_ID" -H "$CONTENT_TYPE" \
    -d '{ "accountId": '"$ACCOUNT_ID"', "firstName": "Rui Miguel", "lastName": "Costa", "role": "ADMIN" }'

# ------------------------------------------
# 3. HOUSES (/api/houses)
# ------------------------------------------
run_test "3.1 POST House" "201" \
    -X POST "$BASE_URL/houses" -H "$CONTENT_TYPE" \
    -d '{ "accountId": '"$ACCOUNT_ID"', "houseName": "Casa de Ferias", "address": "Rua da Praia, 10", "timezone": "GMT" }'
HOUSE_ID=$(extract_field "houseId" "$LAST_BODY")
echo "  [Capturado] HOUSE_ID=$HOUSE_ID"
echo ""

run_test "3.2 GET Todas as Houses" "200" \
    -X GET "$BASE_URL/houses"

run_test "3.3 GET House por ID" "200" \
    -X GET "$BASE_URL/houses/$HOUSE_ID"

run_test "3.4 PUT House" "200" \
    -X PUT "$BASE_URL/houses/$HOUSE_ID" -H "$CONTENT_TYPE" \
    -d '{ "accountId": '"$ACCOUNT_ID"', "houseName": "Casa Principal", "address": "Avenida Central, 1", "timezone": "GMT" }'

# ------------------------------------------
# 4. ROOMS (/api/rooms)
# ------------------------------------------
run_test "4.1 POST Room" "201" \
    -X POST "$BASE_URL/rooms" -H "$CONTENT_TYPE" \
    -d '{ "houseId": '"$HOUSE_ID"', "roomName": "Sala de Estar", "roomType": "LIVING_ROOM", "floor": 1 }'
ROOM_ID=$(extract_field "roomId" "$LAST_BODY")
echo "  [Capturado] ROOM_ID=$ROOM_ID"
echo ""

run_test "4.2 GET Rooms por House ID" "200" \
    -X GET "$BASE_URL/rooms/house/$HOUSE_ID"

run_test "4.3 GET Room por ID" "200" \
    -X GET "$BASE_URL/rooms/$ROOM_ID"

run_test "4.4 PUT Room" "200" \
    -X PUT "$BASE_URL/rooms/$ROOM_ID" -H "$CONTENT_TYPE" \
    -d '{ "houseId": '"$HOUSE_ID"', "roomName": "Sala de Jantar", "roomType": "DINING_ROOM", "floor": 1 }'

# ------------------------------------------
# 5. DEVICES (/api/devices)
# ------------------------------------------
run_test "5.1 POST Device" "201" \
    -X POST "$BASE_URL/devices/$DEV_ID" -H "$CONTENT_TYPE" \
    -d '{ "roomId": '"$ROOM_ID"', "deviceName": "Termostato", "deviceType": "HVAC" }'

run_test "5.2 GET Todos os Devices" "200" \
    -X GET "$BASE_URL/devices"

run_test "5.3 GET Devices por Status" "200" \
    -X GET "$BASE_URL/devices/status/OFFLINE"

run_test "5.4 GET Devices por Room ID" "200" \
    -X GET "$BASE_URL/devices/room/$ROOM_ID"

run_test "5.5 GET Device por ID" "200" \
    -X GET "$BASE_URL/devices/$DEV_ID"

run_test "5.6 PUT Device" "200" \
    -X PUT "$BASE_URL/devices/$DEV_ID" -H "$CONTENT_TYPE" \
    -d '{ "roomId": '"$ROOM_ID"', "deviceName": "Termostato Inteligente", "deviceType": "HVAC" }'

# ------------------------------------------
# 6. PERMISSIONS (/api/permissions)
# ------------------------------------------
run_test "6.1 POST Permission" "201" \
    -X POST "$BASE_URL/permissions" -H "$CONTENT_TYPE" \
    -d '{ "profileId": '"$PROFILE_ID"', "deviceId": "'"$DEV_ID"'", "roomId": '"$ROOM_ID"', "permissionLevel": 1 }'
PERMISSION_ID=$(extract_field "permissionId" "$LAST_BODY")
echo "  [Capturado] PERMISSION_ID=$PERMISSION_ID"
echo ""

run_test "6.2 GET Todas as Permissions" "200" \
    -X GET "$BASE_URL/permissions"

run_test "6.3 GET Permission por ID" "200" \
    -X GET "$BASE_URL/permissions/$PERMISSION_ID"

run_test "6.4 PUT Permission" "200" \
    -X PUT "$BASE_URL/permissions/$PERMISSION_ID" -H "$CONTENT_TYPE" \
    -d '{ "profileId": '"$PROFILE_ID"', "deviceId": "'"$DEV_ID"'", "roomId": '"$ROOM_ID"', "permissionLevel": 2 }'

# ------------------------------------------
# 7. DEVICE COMPONENTS (/api/device-components)
# ------------------------------------------
run_test "7.1 POST Device Component" "201" \
    -X POST "$BASE_URL/device-components" -H "$CONTENT_TYPE" \
    -d '{ "deviceId": "'"$DEV_ID"'", "componentName": "Sensor de Temperatura", "componentType": "SENSOR", "sensorType": "TEMPERATURE", "actuatorType": "NONE", "unit": "Celsius", "mqttTopic": "home/temp" }'
COMPONENT_ID=$(extract_field "componentId" "$LAST_BODY")
echo "  [Capturado] COMPONENT_ID=$COMPONENT_ID"
echo ""

run_test "7.2 GET Components por Device ID" "200" \
    -X GET "$BASE_URL/device-components/device/$DEV_ID"

run_test "7.3 GET Component por ID" "200" \
    -X GET "$BASE_URL/device-components/$COMPONENT_ID"

run_test "7.4 PUT Component" "200" \
    -X PUT "$BASE_URL/device-components/$COMPONENT_ID" -H "$CONTENT_TYPE" \
    -d '{ "deviceId": "'"$DEV_ID"'", "componentName": "Sensor de Temp V2", "componentType": "SENSOR", "sensorType": "TEMPERATURE", "actuatorType": "NONE", "unit": "Celsius", "mqttTopic": "home/temp2" }'

# ------------------------------------------
# 8. DEVICE STATUS LOGS (/api/status-logs)
# ------------------------------------------
run_test "8.1 POST Status Log" "201" \
    -X POST "$BASE_URL/status-logs" -H "$CONTENT_TYPE" \
    -d '{ "deviceId": "'"$DEV_ID"'", "statusValue": "ONLINE" }'
STATUS_LOG_ID=$(extract_field "logId" "$LAST_BODY")
echo "  [Capturado] STATUS_LOG_ID=$STATUS_LOG_ID"
echo ""

run_test "8.2 GET Status Logs por Device ID" "200" \
    -X GET "$BASE_URL/status-logs/device/$DEV_ID"

run_test "8.3 GET Status Log por ID" "200" \
    -X GET "$BASE_URL/status-logs/$STATUS_LOG_ID"

# =================================================================
# FASE DE LIMPEZA (DELETES)
# =================================================================
echo "================================================================="
echo "A INICIAR LIMPEZA DA BASE DE DADOS (DELETES)..."
echo "================================================================="

run_test "DELETE Device Component ($COMPONENT_ID)" "204" \
    -X DELETE "$BASE_URL/device-components/$COMPONENT_ID"

run_test "DELETE Permission ($PERMISSION_ID)" "204" \
    -X DELETE "$BASE_URL/permissions/$PERMISSION_ID"

run_test "DELETE Device ($DEV_ID)" "204" \
    -X DELETE "$BASE_URL/devices/$DEV_ID"

run_test "DELETE Room ($ROOM_ID)" "204" \
    -X DELETE "$BASE_URL/rooms/$ROOM_ID"

run_test "DELETE House ($HOUSE_ID)" "204" \
    -X DELETE "$BASE_URL/houses/$HOUSE_ID"

run_test "DELETE Profile ($PROFILE_ID)" "204" \
    -X DELETE "$BASE_URL/profiles/$PROFILE_ID"

run_test "DELETE Account ($ACCOUNT_ID)" "204" \
    -X DELETE "$BASE_URL/accounts/$ACCOUNT_ID"

# =================================================================
# RESUMO
# =================================================================
echo "================================================================="
if [ ${#FAILED[@]} -eq 0 ]; then
    echo "TODOS OS TESTES PASSARAM!"
else
    echo "TESTES FALHADOS (${#FAILED[@]}):"
    for f in "${FAILED[@]}"; do
        echo "  - $f"
    done
fi
echo "================================================================="