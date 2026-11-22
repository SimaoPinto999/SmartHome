BEGIN;

-- ============================================================
-- CONTA 1 — jonaspistolas@email.com
-- Casa: Bragança Smart Vila
-- Perfis: Jonas (ADMIN, id=1), Guest (GUEST, id=2)
-- ============================================================

-- 1. ACCOUNT
INSERT INTO Account (email, createdAt)
VALUES ('jonaspistolas@email.com', CURRENT_TIMESTAMP);

-- 2. PROFILES (profileId: 1=Jonas, 2=Guest)
INSERT INTO Profile (accountId, firstName, lastName, role, pin) VALUES
(1, 'Jonas', 'Pistolas', 'ADMIN', '$2b$12$lUnB.YiEHM/N/Dj08uKJl.BCTBFTJzc.MM2RZwh91ukr8YwKOez.y'),
(1, 'Guest', 'User', 'GUEST', '$2b$12$K58UCc4.NrdD/GBaVH0f1.laMBCgB5i9x9TtTlQTocp40DsksMk1K');

-- 3. HOUSE (houseId: 1)
INSERT INTO House (accountId, houseName, address, timezone)
VALUES (1, 'Bragança Smart Vila', 'Engineering Ave, Guarda 6300', 'Europe/Lisbon');

-- 4. ROOMS (roomId: 1–6)
INSERT INTO Room (houseId, roomName, roomType, floor) VALUES
(1, 'Living Room', 'LIVING_ROOM', 0),
(1, 'Kitchen', 'KITCHEN', 0),
(1, 'Master Bedroom', 'BEDROOM', 1),
(1, 'Home Office', 'OFFICE', 1),
(1, 'Garage', 'GARAGE', -1),
(1, 'Backyard Garden', 'OUTSIDE', 0);

-- 5. DEVICES
INSERT INTO Device (deviceId, roomId, deviceName, deviceType, status) VALUES
('ESP32-LIV1-01', 1, 'Main Living Panel', 'GATEWAY', 'ONLINE'),
('ESP32-LIV1-02', 1, 'AC Thermostat', 'CONTROLLER', 'ONLINE'),
('ESP32-KIT2-01', 2, 'Fridge Monitor', 'SENSOR_NODE', 'ONLINE'),
('ESP32-BED3-01', 3, 'Bedroom Lights', 'ACTUATOR', 'ONLINE'),
('ESP32-BED3-02', 3, 'Bedroom Thermostat', 'CONTROLLER', 'ONLINE'),
('ESP32-OFF4-01', 4, 'PC Energy Meter', 'SENSOR_NODE', 'ONLINE'),
('ESP32-GAR5-01', 5, 'Garage Gate', 'ACTUATOR', 'ONLINE'),
('ESP32-GAR5-02', 5, 'Smoke Detector', 'SECURITY', 'ONLINE'),
('ESP32-GARD6-01', 6, 'Smart Irrigation', 'ACTUATOR', 'OFFLINE'),
('ESP32-GARD6-02', 6, 'Weather Station', 'SENSOR_NODE', 'ONLINE');

-- 6. DEVICE_COMPONENTS
INSERT INTO DeviceComponent (deviceId, componentName, componentType, sensorType, actuatorType, unit, mqttTopic, nominal_watts) VALUES
('ESP32-LIV1-01', 'Living Room Spotlight', 'ACTUATOR', NULL, 'LIGHT', 'PERCENT', 'home/1/living/spotlight', 40),
('ESP32-LIV1-02', 'Ambient Temperature', 'SENSOR', 'TEMPERATURE', NULL, 'CELSIUS', 'home/1/living/temp', 1),
('ESP32-KIT2-01', 'Fridge Door Sensor', 'SENSOR', 'CONTACT', NULL, 'BINARY', 'home/1/kitchen/fridge', 1),
('ESP32-BED3-01', 'RGB LED Strip', 'ACTUATOR', NULL, 'LIGHT', 'RGB', 'home/1/bedroom/led', 26),
('ESP32-BED3-01', 'Motion Sensor', 'SENSOR', 'MOTION', NULL, 'BINARY', 'home/1/bedroom/motion', 1),
('ESP32-OFF4-01', 'Current Consumption', 'SENSOR', 'POWER', NULL, 'WATTS', 'home/1/office/power', 2),
('ESP32-GAR5-01', 'Gate Motor', 'ACTUATOR', NULL, 'MOTOR', 'BINARY', 'home/1/garage/gate', 201),
('ESP32-GAR5-02', 'Smoke Level', 'SENSOR', 'SMOKE', NULL, 'PERCENT', 'home/1/garage/smoke', 1),
('ESP32-GARD6-01', 'Water Valve', 'ACTUATOR', NULL, 'VALVE', 'BINARY', 'home/1/garden/water', 11),
('ESP32-GARD6-02', 'Rain Gauge', 'SENSOR', 'RAIN', NULL, 'MM', 'home/1/garden/rain', 1),
('ESP32-GARD6-02', 'LDR Brightness', 'SENSOR', 'LIGHT', NULL, 'LUX', 'home/1/garden/lux', 0),
('ESP32-LIV1-02', 'Living Room Thermostat', 'ACTUATOR', NULL, 'HVAC', 'CELSIUS', 'home/1/living/thermostat', 5),
('ESP32-BED3-02', 'Bedroom Thermostat', 'ACTUATOR', NULL, 'HVAC', 'CELSIUS', 'home/1/bedroom/thermostat', 5);

-- 7. PERMISSIONS
INSERT INTO Permission (profileId, deviceId, roomId, permissionLevel) VALUES
(2, NULL, 1, 2),
(2, NULL, 6, 1),
(2, 'ESP32-BED3-01', NULL, 1);

-- 8. DEVICE_STATUS_LOG
INSERT INTO DeviceStatusLog (deviceId, statusValue, timestamp) VALUES
('ESP32-GARD6-01', 'CONNECTION_LOST', CURRENT_TIMESTAMP - INTERVAL '1 hour'),
('ESP32-LIV1-01', 'SYSTEM_BOOT', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
('ESP32-GAR5-02', 'BATTERY_LOW', CURRENT_TIMESTAMP - INTERVAL '30 minutes');


-- ============================================================
-- CONTA 2 — mariasilveira@email.com
-- Casa: Nelas Smart Home
-- Perfis: Maria (ADMIN, id=3), João (RESTRICTED, id=4)
-- ============================================================

-- 1. ACCOUNT
INSERT INTO Account (email, createdAt)
VALUES ('mariasilveira@email.com', CURRENT_TIMESTAMP);

-- 2. PROFILES (profileId: 3=Maria, 4=João)
INSERT INTO Profile (accountId, firstName, lastName, role, pin) VALUES
(2, 'Maria', 'Silveira', 'ADMIN', '$2b$12$Hqu0yi5TkYjR7GKYM4orb.VmACj6a7dSZzBn.nUGEYge7BEL5rS62'),
(2, 'João', 'Silveira', 'RESTRICTED', '$2b$12$BljWHmTPD.j2pmn4iIgWJu.wrOK9seR9MXC2Gib8XGDD5YNwA.DD6');

-- 3. HOUSE (houseId: 2)
INSERT INTO House (accountId, houseName, address, timezone)
VALUES (2, 'Nelas Smart Home', 'Rua do Meio do Lugar, Nelas 3530', 'Europe/Lisbon');

-- 4. ROOMS (roomId: 7–10)
INSERT INTO Room (houseId, roomName, roomType, floor) VALUES
(2, 'Sala de Estar', 'LIVING_ROOM', 0),
(2, 'Quarto Principal', 'BEDROOM', 1),
(2, 'Cozinha', 'KITCHEN', 0),
(2, 'Casa de Banho', 'BATHROOM', 1);

-- 5. DEVICES
INSERT INTO Device (deviceId, roomId, deviceName, deviceType, status) VALUES
('ESP32-LIV7-01', 7, 'Living Room Hub', 'GATEWAY', 'ONLINE'),
('ESP32-LIV7-02', 7, 'Smart Bulb', 'ACTUATOR', 'ONLINE'),
('ESP32-BED8-01', 8, 'Bedroom Sensor Node', 'SENSOR_NODE', 'ONLINE'),
('ESP32-KIT9-01', 9, 'Kitchen Monitor', 'SENSOR_NODE', 'ONLINE'),
('ESP32-BAT10-01', 10, 'Bathroom Heater', 'ACTUATOR', 'OFFLINE');

-- 6. DEVICE_COMPONENTS
INSERT INTO DeviceComponent (deviceId, componentName, componentType, sensorType, actuatorType, unit, mqttTopic, nominal_watts) VALUES
('ESP32-LIV7-01', 'Living Temperature', 'SENSOR', 'TEMPERATURE', NULL, 'CELSIUS', 'home/2/living/temp', 1),
('ESP32-LIV7-02', 'Ceiling Light', 'ACTUATOR', NULL, 'LIGHT', 'BINARY', 'home/2/living/light', 16),
('ESP32-BED8-01', 'Bedroom Temp', 'SENSOR', 'TEMPERATURE', NULL, 'CELSIUS', 'home/2/bedroom/temp', 1),
('ESP32-BED8-01', 'Window Contact', 'SENSOR', 'CONTACT', NULL, 'BINARY', 'home/2/bedroom/window', 1),
('ESP32-KIT9-01', 'Fridge Door', 'SENSOR', 'CONTACT', NULL, 'BINARY', 'home/2/kitchen/fridge', 1),
('ESP32-KIT9-01', 'Kitchen Power', 'SENSOR', 'POWER', NULL, 'WATTS', 'home/2/kitchen/power', 2),
('ESP32-BAT10-01', 'Heater Valve', 'ACTUATOR', NULL, 'VALVE', 'BINARY', 'home/2/bathroom/heater', 1501);

-- 7. PERMISSIONS
INSERT INTO Permission (profileId, deviceId, roomId, permissionLevel) VALUES
(4, NULL, 7, 1),
(4, NULL, 8, 1);

-- 8. DEVICE_STATUS_LOG
INSERT INTO DeviceStatusLog (deviceId, statusValue, timestamp) VALUES
('ESP32-BAT10-01', 'CONNECTION_LOST', CURRENT_TIMESTAMP - INTERVAL '45 minutes'),
('ESP32-LIV7-01', 'SYSTEM_BOOT', CURRENT_TIMESTAMP - INTERVAL '3 hours');


-- ============================================================
-- ENERGY PRICE HISTORY
-- ============================================================
INSERT INTO EnergyPriceHistory (houseId, pricePerKwh, validFrom) VALUES
(1, 0.1934, '2024-01-01 00:00:00'),
(2, 0.1934, '2024-01-01 00:00:00');


-- ============================================================
-- AUTOMATION RULES — House 1 (Bragança Smart Vila)
-- ============================================================

-- Rule 1: Smoke > 3% → ERROR alert
INSERT INTO AutomationRule (houseId, sensorComponentId, name, operator, cooldownMinutes, enabled)
VALUES (1, 8, 'High Smoke Alert', 'GT', 5, TRUE);

INSERT INTO RuleCondition (ruleId, type, threshold)
VALUES (1, 'FIXED', 3.0);

INSERT INTO RuleAction (ruleId, type, severity)
VALUES (1, 'ALERT', 'CRITICAL');

-- Rule 2: Lux < 3000 → turn on living room light
INSERT INTO AutomationRule (houseId, sensorComponentId, name, operator, cooldownMinutes, enabled)
VALUES (1, 11, 'Auto Light On (Low Brightness)', 'LT', 10, TRUE);

INSERT INTO RuleCondition (ruleId, type, threshold)
VALUES (2, 'FIXED', 3000.0);

INSERT INTO RuleAction (ruleId, type, targetComponentId, value)
VALUES (2, 'MQTT_COMMAND', 1, '100');

-- Rule 3: Living temp > weather temp + 3°C → WARNING alert
INSERT INTO AutomationRule (houseId, sensorComponentId, name, operator, cooldownMinutes, enabled)
VALUES (1, 2, 'Interior Temp Above Outdoor', 'GT', 30, TRUE);

INSERT INTO RuleCondition (ruleId, type, externalSource, offsetValue)
VALUES (3, 'EXTERNAL', 'WEATHER_TEMP', 3.0);

INSERT INTO RuleAction (ruleId, type, severity)
VALUES (3, 'ALERT', 'WARNING');

-- ============================================================
-- TIME-BASED RULES — House 1 (Bragança Smart Vila)
-- ============================================================

-- 30 min before sunset → set Living Room Spotlight to 70%
INSERT INTO TimeBasedRule (houseId, name, enabled, referencePoint, offsetMinutes, targetComponentId, value, cooldownMinutes)
VALUES (1, 'Sunset Ambient Lighting', TRUE, 'SUNSET', -30, 1, '70', 120);

-- at sunrise → set Living Room Spotlight to 30%
INSERT INTO TimeBasedRule (houseId, name, enabled, referencePoint, offsetMinutes, targetComponentId, value, cooldownMinutes)
VALUES (1, 'Sunrise Wake-up Light', TRUE, 'SUNRISE', 0, 1, '30', 120);

COMMIT;