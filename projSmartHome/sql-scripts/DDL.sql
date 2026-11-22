CREATE TABLE Account (
    accountId BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Profile (
    profileId BIGSERIAL PRIMARY KEY,
    accountId BIGINT NOT NULL,
    firstName VARCHAR(100) NOT NULL,
    lastName VARCHAR(100),
    role VARCHAR(50) NOT NULL,
    pin VARCHAR(60),
    CONSTRAINT fk_account_profile FOREIGN KEY (accountId) REFERENCES Account(accountId) ON DELETE CASCADE,
    CONSTRAINT chk_role CHECK (role IN ('ADMIN', 'RESTRICTED', 'GUEST'))
);

CREATE TABLE House (
    houseId BIGSERIAL PRIMARY KEY,
    accountId BIGINT NOT NULL,
    houseName VARCHAR(150) NOT NULL,
    address TEXT,
    timezone VARCHAR(50) DEFAULT 'UTC',
    alarmArmed BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_account_house FOREIGN KEY (accountId) REFERENCES Account(accountId) ON DELETE CASCADE
);

CREATE TABLE Room (
    roomId BIGSERIAL PRIMARY KEY,
    houseId BIGINT NOT NULL,
    roomName VARCHAR(100) NOT NULL,
    roomType VARCHAR(50),
    floor INTEGER DEFAULT 0,
    CONSTRAINT fk_house_room FOREIGN KEY (houseId) REFERENCES House(houseId) ON DELETE CASCADE
);

CREATE TABLE Device (
    deviceId VARCHAR(100) PRIMARY KEY,
    roomId BIGINT NOT NULL,
    deviceName VARCHAR(150) NOT NULL,
    deviceType VARCHAR(50),
    status VARCHAR(50) DEFAULT 'OFFLINE',
    CONSTRAINT fk_room_device FOREIGN KEY (roomId) REFERENCES Room(roomId) ON DELETE CASCADE
);

CREATE TABLE DeviceComponent (
    componentId BIGSERIAL PRIMARY KEY,
    deviceId VARCHAR(100) NOT NULL,
    componentName VARCHAR(150),
    componentType VARCHAR(50),
    sensorType VARCHAR(50),
    actuatorType VARCHAR(50),
    unit VARCHAR(20),
    mqttTopic VARCHAR(255) UNIQUE NOT NULL,
    nominal_watts DECIMAL(8,2) DEFAULT NULL,
    CONSTRAINT fk_device_component FOREIGN KEY (deviceId) REFERENCES Device(deviceId) ON DELETE CASCADE
);

CREATE TABLE DeviceStatusLog (
    logId BIGSERIAL PRIMARY KEY,
    deviceId VARCHAR(100) NOT NULL,
    statusValue VARCHAR(50) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_device_log FOREIGN KEY (deviceId) REFERENCES Device(deviceId) ON DELETE CASCADE
);

CREATE INDEX idx_status_log_device_time ON DeviceStatusLog(deviceId, timestamp);

-- permissionLevel: 1 = READ, 2 = CONTROL, 3 = ADMIN
-- READ: pode ver dados e histórico
-- CONTROL: pode também enviar comandos aos dispositivos
-- ADMIN: pode gerir membros e configurações da divisão/dispositivo
CREATE TABLE Permission (
    permissionId BIGSERIAL PRIMARY KEY,
    profileId BIGINT NOT NULL,
    deviceId VARCHAR(100),
    roomId BIGINT,
    permissionLevel INTEGER NOT NULL,
    CONSTRAINT fk_profile_perm FOREIGN KEY (profileId) REFERENCES Profile(profileId) ON DELETE CASCADE,
    CONSTRAINT fk_device_perm FOREIGN KEY (deviceId) REFERENCES Device(deviceId) ON DELETE CASCADE,
    CONSTRAINT fk_room_perm FOREIGN KEY (roomId) REFERENCES Room(roomId) ON DELETE CASCADE,
    CONSTRAINT chk_permission_target CHECK ((deviceId IS NULL) <> (roomId IS NULL)),
    CONSTRAINT chk_permission_level CHECK (permissionLevel IN (1, 2, 3))
);

-- Indexes for FKs to improve performance
CREATE INDEX idx_profile_account_id ON Profile(accountId);
CREATE INDEX idx_house_account_id ON House(accountId);

CREATE INDEX idx_room_house_id ON Room(houseId);       
CREATE INDEX idx_device_room_id ON Device(roomId);      
CREATE INDEX idx_component_device_id ON DeviceComponent(deviceId); 

CREATE INDEX idx_permission_profile_id ON Permission(profileId); 
CREATE INDEX idx_permission_device_id ON Permission(deviceId) WHERE deviceId IS NOT NULL; 
CREATE INDEX idx_permission_room_id ON Permission(roomId) WHERE roomId IS NOT NULL;   

-- Automation Engine

CREATE TABLE AutomationRule (
    ruleId BIGSERIAL PRIMARY KEY,
    houseId BIGINT NOT NULL,
    sensorComponentId BIGINT NOT NULL,
    name VARCHAR(150) NOT NULL,
    operator VARCHAR(2) NOT NULL,
    cooldownMinutes INTEGER NOT NULL DEFAULT 5,
    lastTriggeredAt TIMESTAMPTZ,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_rule_house FOREIGN KEY (houseId) REFERENCES House(houseId) ON DELETE CASCADE,
    CONSTRAINT fk_rule_sensor FOREIGN KEY (sensorComponentId) REFERENCES DeviceComponent(componentId) ON DELETE CASCADE,
    CONSTRAINT chk_rule_op CHECK (operator IN ('GT', 'LT', 'EQ'))
);

CREATE TABLE RuleCondition (
    conditionId BIGSERIAL PRIMARY KEY,
    ruleId BIGINT NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL,
    threshold DOUBLE PRECISION,
    externalSource VARCHAR(50),
    offsetValue DOUBLE PRECISION,
    CONSTRAINT fk_cond_rule FOREIGN KEY (ruleId) REFERENCES AutomationRule(ruleId) ON DELETE CASCADE,
    CONSTRAINT chk_cond_type CHECK (type IN ('FIXED', 'EXTERNAL')),
    CONSTRAINT chk_cond_fixed CHECK (type <> 'FIXED' OR threshold IS NOT NULL),
    CONSTRAINT chk_cond_external CHECK (type <> 'EXTERNAL' OR (externalSource IS NOT NULL AND offsetValue IS NOT NULL))
);

CREATE TABLE RuleAction (
    actionId BIGSERIAL PRIMARY KEY,
    ruleId BIGINT NOT NULL,
    type VARCHAR(20) NOT NULL,
    targetComponentId BIGINT,
    value VARCHAR(50),
    severity VARCHAR(20),
    auto_off_minutes INTEGER DEFAULT NULL,
    auto_off_at TIMESTAMPTZ DEFAULT NULL,
    CONSTRAINT fk_action_rule FOREIGN KEY (ruleId) REFERENCES AutomationRule(ruleId) ON DELETE CASCADE,
    CONSTRAINT fk_action_target FOREIGN KEY (targetComponentId) REFERENCES DeviceComponent(componentId) ON DELETE SET NULL,
    CONSTRAINT chk_action_type CHECK (type IN ('MQTT_COMMAND', 'ALERT')),
    CONSTRAINT chk_action_cmd CHECK (type <> 'MQTT_COMMAND' OR (targetComponentId IS NOT NULL AND value IS NOT NULL)),
    CONSTRAINT chk_action_alert CHECK (type <> 'ALERT' OR severity IN ('WARNING', 'CRITICAL'))
);

CREATE TABLE Alert (
    alertId BIGSERIAL PRIMARY KEY,
    ruleId BIGINT NOT NULL,
    message VARCHAR(255) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    alertType VARCHAR(30) NOT NULL DEFAULT 'AUTOMATION',
    triggeredAt TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_alert_rule FOREIGN KEY (ruleId) REFERENCES AutomationRule(ruleId) ON DELETE CASCADE,
    CONSTRAINT chk_alert_severity CHECK (severity IN ('WARNING', 'CRITICAL')),
    CONSTRAINT chk_alert_type CHECK (alertType IN ('AUTOMATION', 'INTRUSION'))
);

CREATE INDEX idx_alert_ack_time ON Alert(acknowledged, triggeredAt DESC);
CREATE INDEX idx_rule_sensor_enabled ON AutomationRule(sensorComponentId, enabled);
CREATE INDEX idx_automation_rule_house_id ON AutomationRule(houseId);
CREATE INDEX idx_rule_condition_rule_id ON RuleCondition(ruleId);
CREATE INDEX idx_rule_action_rule_id ON RuleAction(ruleId);
CREATE INDEX idx_rule_action_target_comp ON RuleAction(targetComponentId) WHERE targetComponentId IS NOT NULL;
CREATE INDEX idx_alert_rule_id ON Alert(ruleId);

-- Histórico de preços de electricidade por casa
-- Cada entrada representa o preço activo a partir de validFrom.
-- Para saber o preço num dado momento, busca-se o registo mais recente
-- com validFrom <= timestamp desejado.

CREATE TABLE EnergyPriceHistory (
    priceId BIGSERIAL PRIMARY KEY,
    houseId BIGINT NOT NULL,
    pricePerKwh DECIMAL(6,4) NOT NULL,
    validFrom TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_house_price FOREIGN KEY (houseId) REFERENCES House(houseId) ON DELETE CASCADE
);

CREATE INDEX idx_energy_price_house_time ON EnergyPriceHistory(houseId, validFrom DESC);

-- Security/Activity Events
CREATE TABLE ActivityLog (
    logId BIGSERIAL PRIMARY KEY,
    houseId BIGINT NOT NULL,
    componentId BIGINT,
    eventType VARCHAR(50) NOT NULL,
    message VARCHAR(255) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_activity_house FOREIGN KEY (houseId) REFERENCES House(houseId) ON DELETE CASCADE,
    CONSTRAINT fk_activity_component FOREIGN KEY (componentId) REFERENCES DeviceComponent(componentId) ON DELETE SET NULL
);

CREATE INDEX idx_activity_log_house_time ON ActivityLog(houseId, timestamp DESC);

-- Time-Based Rules (sunset/sunrise triggered automation)
CREATE TABLE TimeBasedRule (
    ruleId            BIGSERIAL PRIMARY KEY,
    houseId           BIGINT NOT NULL,
    name              VARCHAR(150) NOT NULL,
    enabled           BOOLEAN NOT NULL DEFAULT TRUE,
    referencePoint    VARCHAR(10) NOT NULL,
    offsetMinutes     INTEGER NOT NULL DEFAULT 0,
    targetComponentId BIGINT NOT NULL,
    value             VARCHAR(50) NOT NULL,
    cooldownMinutes   INTEGER NOT NULL DEFAULT 60,
    lastTriggeredAt   TIMESTAMPTZ,
    CONSTRAINT fk_tbr_house   FOREIGN KEY (houseId)           REFERENCES House(houseId)              ON DELETE CASCADE,
    CONSTRAINT fk_tbr_target  FOREIGN KEY (targetComponentId) REFERENCES DeviceComponent(componentId) ON DELETE CASCADE,
    CONSTRAINT chk_tbr_ref    CHECK (referencePoint IN ('SUNSET', 'SUNRISE'))
);

CREATE INDEX idx_tbr_house_enabled ON TimeBasedRule(houseId, enabled);
CREATE INDEX idx_tbr_enabled ON TimeBasedRule(enabled);
