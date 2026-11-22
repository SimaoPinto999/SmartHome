package pt.deti.iesg304.smarthome.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pt.deti.iesg304.smarthome.model.Alert;
import pt.deti.iesg304.smarthome.model.AutomationRule;
import pt.deti.iesg304.smarthome.model.DeviceComponent;
import pt.deti.iesg304.smarthome.model.House;
import pt.deti.iesg304.smarthome.model.ActivityLog;
import pt.deti.iesg304.smarthome.dto.AlertResponse;
import pt.deti.iesg304.smarthome.repository.ActivityLogRepository;
import pt.deti.iesg304.smarthome.repository.AlertRepository;
import pt.deti.iesg304.smarthome.repository.AutomationRuleRepository;
import pt.deti.iesg304.smarthome.repository.HouseRepository;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class IntrusionDetector {

    private static final Logger log = LoggerFactory.getLogger(IntrusionDetector.class);
    private static final int ALERT_COOLDOWN_MINUTES = 10;

    // houseId -> timestamp of last intrusion alert created
    private final Map<Long, LocalDateTime> lastAlertByHouse = new ConcurrentHashMap<>();

    private final HouseRepository houseRepository;
    private final AlertRepository alertRepository;
    private final AutomationRuleRepository ruleRepository;
    private final ActivityLogRepository activityLogRepository;
    private final RealtimePublisher realtimePublisher;

    public IntrusionDetector(HouseRepository houseRepository,
                             AlertRepository alertRepository,
                             AutomationRuleRepository ruleRepository,
                             ActivityLogRepository activityLogRepository,
                             RealtimePublisher realtimePublisher) {
        this.houseRepository = houseRepository;
        this.alertRepository = alertRepository;
        this.ruleRepository = ruleRepository;
        this.activityLogRepository = activityLogRepository;
        this.realtimePublisher = realtimePublisher;
    }

    @Transactional
    public void onMotionSensor(DeviceComponent component, String payload) {
        String p = payload.trim();
        boolean motionDetected = "ON".equalsIgnoreCase(p) || "1".equals(p) || "true".equalsIgnoreCase(p);
        if (!motionDetected) return;

        House house = houseRepository.findByComponentId(component.getComponentId()).orElse(null);
        if (house == null || !Boolean.TRUE.equals(house.getAlarmArmed())) return;

        LocalDateTime lastAlert = lastAlertByHouse.get(house.getHouseId());
        if (lastAlert != null && lastAlert.plusMinutes(ALERT_COOLDOWN_MINUTES).isAfter(LocalDateTime.now())) {
            log.info("Intrusion detector: cooldown active for house {}, skipping alert", house.getHouseId());
            return;
        }

        createIntrusionAlert(house, component);
    }

    private void createIntrusionAlert(House house, DeviceComponent motionComponent) {
        AutomationRule rule = getOrCreateIntrusionRule(house, motionComponent);

        Alert alert = new Alert();
        alert.setRule(rule);
        alert.setMessage("Intrusion detected! Motion detected while alarm was armed.");
        alert.setSeverity("CRITICAL");
        alert.setAlertType("INTRUSION");
        alert.setTriggeredAt(LocalDateTime.now());
        alert.setAcknowledged(false);
        alertRepository.save(alert);
        try {
            realtimePublisher.publishAlert(house.getHouseId(), new AlertResponse(
                    alert.getAlertId(),
                    rule.getRuleId(),
                    rule.getName(),
                    alert.getMessage(),
                    alert.getSeverity(),
                    alert.getTriggeredAt(),
                    alert.getAcknowledged(),
                    alert.getAlertType()
            ));
        } catch (Exception e) {
            log.warn("Failed to publish alert over WebSocket for house {}", house.getHouseId(), e);
        }
        lastAlertByHouse.put(house.getHouseId(), LocalDateTime.now());

        ActivityLog actLog = new ActivityLog();
        actLog.setHouse(house);
        actLog.setComponent(motionComponent);
        actLog.setEventType("ALERT");
        actLog.setMessage("Intrusion detected! Motion detected while alarm was armed.");
        actLog.setTimestamp(LocalDateTime.now());
        activityLogRepository.save(actLog);

        log.warn("INTRUSION ALERT created for house {}", house.getHouseId());
    }

    private synchronized AutomationRule getOrCreateIntrusionRule(House house, DeviceComponent motionComponent) {
        return ruleRepository.findByHouse_HouseIdAndName(house.getHouseId(), "System: Intrusion Detection")
                .orElseGet(() -> {
                    AutomationRule rule = new AutomationRule();
                    rule.setHouse(house);
                    rule.setSensorComponent(motionComponent);
                    rule.setName("System: Intrusion Detection");
                    rule.setOperator("GT");
                    rule.setCooldownMinutes(1);
                    rule.setEnabled(true);
                    return ruleRepository.save(rule);
                });
    }
}
