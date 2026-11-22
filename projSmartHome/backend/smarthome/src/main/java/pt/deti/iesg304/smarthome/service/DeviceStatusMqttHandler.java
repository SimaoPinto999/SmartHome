package pt.deti.iesg304.smarthome.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import pt.deti.iesg304.smarthome.model.DeviceComponent;
import pt.deti.iesg304.smarthome.repository.DeviceComponentRepository;

import java.util.Optional;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.time.Instant;
import java.time.LocalDateTime;
import pt.deti.iesg304.smarthome.dto.SensorReadingMessage;

import pt.deti.iesg304.smarthome.model.ActivityLog;
import pt.deti.iesg304.smarthome.model.House;
import pt.deti.iesg304.smarthome.repository.ActivityLogRepository;
import pt.deti.iesg304.smarthome.repository.HouseRepository;
@Service
public class DeviceStatusMqttHandler {

    private static final Logger log = LoggerFactory.getLogger(DeviceStatusMqttHandler.class);

    private final DeviceComponentRepository deviceComponentRepository;
    private final InfluxDBService influxDBService;
    private final AutomationEvaluator automationEvaluator;
    private final ActivityLogRepository activityLogRepository;
    private final HouseRepository houseRepository;
    private final RealtimePublisher realtimePublisher;

    private final Map<Long, String> lastKnownState = new ConcurrentHashMap<>();

    public DeviceStatusMqttHandler(DeviceComponentRepository deviceComponentRepository,
                                   InfluxDBService influxDBService,
                                   AutomationEvaluator automationEvaluator,
                                   ActivityLogRepository activityLogRepository,
                                   HouseRepository houseRepository,
                                   RealtimePublisher realtimePublisher) {
        this.deviceComponentRepository = deviceComponentRepository;
        this.influxDBService = influxDBService;
        this.automationEvaluator = automationEvaluator;
        this.activityLogRepository = activityLogRepository;
        this.houseRepository = houseRepository;
        this.realtimePublisher = realtimePublisher;
    }

    /**
     * Processes an incoming MQTT message, writing the payload as telemetry to InfluxDB.
     * @param topic - MQTT topic of the message.
     * @param payload - Payload of the message.
     */
    public void processMessage(String topic, String payload) {
        try {
            Optional<DeviceComponent> componentOpt = deviceComponentRepository.findByMqttTopic(topic);
            
            if (componentOpt.isPresent()) {
                DeviceComponent component = componentOpt.get();
                // Write directly to InfluxDB as telemetry
                String measurement = component.getActuatorType() != null ? "actuator_state" : "sensor_reading";
                influxDBService.writeSensorData(
                    component.getComponentId().toString(),
                    payload,
                    component.getDevice().getDeviceId(),
                    measurement,
                    component.getUnit()
                );
                automationEvaluator.evaluate(component, payload);

                houseRepository.findByComponentId(component.getComponentId()).ifPresent(house -> {
                    try {
                        SensorReadingMessage msg = new SensorReadingMessage(
                                component.getComponentId(), payload, component.getUnit(),
                                measurement, Instant.now());
                        realtimePublisher.publishSensorReading(house.getHouseId(), msg);
                    } catch (Exception e) {
                        log.warn("Failed to publish sensor reading over WebSocket for component {}", component.getComponentId(), e);
                    }

                    trackActivityLog(component, payload, house);
                });

                log.info("Processed telemetry for component {}: {} = {}", component.getComponentId(), topic, payload);
            } else {
                log.warn("Received message on unknown topic: {} with payload: {}", topic, payload);
            }
        } catch (Exception e) {
            log.error("Failed to process MQTT message on topic: {}", topic, e);
        }
    }

    private void trackActivityLog(DeviceComponent component, String payload, House house) {
        String cleanPayload = payload.trim().toUpperCase();
        Long compId = component.getComponentId();

        // Check if state actually changed
        String previousState = lastKnownState.get(compId);
        if (cleanPayload.equals(previousState)) {
            return;
        }
        lastKnownState.put(compId, cleanPayload);

        // We only care about specific security/meaningful events
        boolean isContact = "CONTACT".equals(component.getSensorType());
        boolean isMotion = "MOTION".equals(component.getSensorType());
        boolean isLockOrMotor = "MOTOR".equals(component.getActuatorType()) || "VALVE".equals(component.getActuatorType());

        if (!isContact && !isMotion && !isLockOrMotor) {
            return;
        }

        // Determine message
        String message = "";
        String eventType = "SENSOR";

        if (isContact) {
            message = "OPEN".equals(cleanPayload) ? "Door/Window Opened" : "Door/Window Closed";
        } else if (isMotion) {
            if ("ON".equals(cleanPayload) || "1".equals(cleanPayload)) {
                message = "Motion detected";
            } else {
                message = "Motion stopped";
            }
        } else if (isLockOrMotor) {
            eventType = "ACTUATOR";
            message = "ON".equals(cleanPayload) || "OPEN".equals(cleanPayload) ? "Device Opened/Unlocked" : "Device Closed/Locked";
        }

        ActivityLog logEntry = new ActivityLog();
        logEntry.setHouse(house);
        logEntry.setComponent(component);
        logEntry.setEventType(eventType);
        logEntry.setMessage(message);
        logEntry.setTimestamp(LocalDateTime.now());

        activityLogRepository.save(logEntry);
    }
}
