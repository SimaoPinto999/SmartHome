package pt.deti.iesg304.smarthome.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pt.deti.iesg304.smarthome.config.MqttPublisherConfig;
import pt.deti.iesg304.smarthome.model.Alert;
import pt.deti.iesg304.smarthome.model.AutomationRule;
import pt.deti.iesg304.smarthome.model.DeviceComponent;
import pt.deti.iesg304.smarthome.model.RuleAction;
import pt.deti.iesg304.smarthome.model.RuleCondition;
import pt.deti.iesg304.smarthome.repository.AlertRepository;
import pt.deti.iesg304.smarthome.repository.AutomationRuleRepository;
import pt.deti.iesg304.smarthome.repository.RuleActionRepository;
import pt.deti.iesg304.smarthome.repository.RuleConditionRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AutomationEvaluator {

    private static final Logger log = LoggerFactory.getLogger(AutomationEvaluator.class);

    private static final long AUTO_OFF_SWEEP_INTERVAL_MS = 30_000;

    private final AutomationRuleRepository ruleRepository;
    private final RuleConditionRepository conditionRepository;
    private final RuleActionRepository actionRepository;
    private final AlertRepository alertRepository;
    private final WeatherService weatherService;
    private final MqttPublisherConfig.MqttGateway mqttGateway;
    private final IntrusionDetector intrusionDetector;

    public AutomationEvaluator(AutomationRuleRepository ruleRepository,
                                RuleConditionRepository conditionRepository,
                                RuleActionRepository actionRepository,
                                AlertRepository alertRepository,
                                WeatherService weatherService,
                                MqttPublisherConfig.MqttGateway mqttGateway,
                                IntrusionDetector intrusionDetector) {
        this.ruleRepository = ruleRepository;
        this.conditionRepository = conditionRepository;
        this.actionRepository = actionRepository;
        this.alertRepository = alertRepository;
        this.weatherService = weatherService;
        this.mqttGateway = mqttGateway;
        this.intrusionDetector = intrusionDetector;
    }

    private Double parseSensorValue(String payload) {
        if (payload == null) {
            return null;
        }
        String normalizedPayload = payload.trim();
        if (normalizedPayload.isEmpty()) {
            return null;
        }
        try {
            return Double.parseDouble(normalizedPayload);
        } catch (NumberFormatException ignored) {
            String binaryPayload = normalizedPayload.toUpperCase();
            switch (binaryPayload) {
                case "ON":
                case "OPEN":
                case "TRUE":
                case "MOTION":
                case "DETECTED":
                    return 1.0;
                case "OFF":
                case "CLOSED":
                case "FALSE":
                case "NO_MOTION":
                case "CLEAR":
                    return 0.0;
                default:
                    return null;
            }
        }
    }

    @Transactional
    public void evaluate(DeviceComponent component, String payload) {
        if ("MOTION".equalsIgnoreCase(component.getSensorType())) {
            intrusionDetector.onMotionSensor(component, payload);
        }

        Double currentValue = parseSensorValue(payload);
        if (currentValue == null) {
            return;
        }

        List<AutomationRule> rules = ruleRepository
                .findBySensorComponent_ComponentIdAndEnabledTrue(component.getComponentId());

        for (AutomationRule rule : rules) {
            try {
                evaluateRule(rule, currentValue);
            } catch (Exception e) {
                log.error("Error evaluating rule {}: {}", rule.getRuleId(), e.getMessage());
            }
        }
    }

    private void evaluateRule(AutomationRule rule, double currentValue) {
        LocalDateTime now = LocalDateTime.now();

        if (rule.getLastTriggeredAt() != null) {
            LocalDateTime nextAllowed = rule.getLastTriggeredAt().plusMinutes(rule.getCooldownMinutes());
            if (now.isBefore(nextAllowed)) {
                return;
            }
        }

        RuleCondition condition = conditionRepository.findByRule_RuleId(rule.getRuleId()).orElse(null);
        if (condition == null) return;

        double threshold;
        if ("FIXED".equals(condition.getType())) {
            threshold = condition.getThreshold();
        } else {
            threshold = weatherService.getValue(condition.getExternalSource()) + condition.getOffsetValue();
        }

        boolean triggered = switch (rule.getOperator()) {
            case "GT" -> currentValue > threshold;
            case "LT" -> currentValue < threshold;
            case "EQ" -> currentValue == threshold;
            default -> false;
        };

        if (!triggered) return;

        List<RuleAction> actions = actionRepository.findByRule_RuleId(rule.getRuleId());
        for (RuleAction action : actions) {
            if ("MQTT_COMMAND".equals(action.getType()) && action.getTargetComponent() != null) {
                String cmdTopic = action.getTargetComponent().getMqttTopic() + "/set";
                mqttGateway.publish(cmdTopic, action.getValue());
                log.info("Rule {}: published '{}' to '{}'", rule.getRuleId(), action.getValue(), cmdTopic);

                if (action.getAutoOffMinutes() != null && action.getAutoOffMinutes() > 0) {
                    action.setAutoOffAt(now.plusMinutes(action.getAutoOffMinutes()));
                    actionRepository.save(action);
                    log.info("Rule {}: auto-off scheduled at {} for '{}'", rule.getRuleId(), action.getAutoOffAt(), cmdTopic);
                }
            } else if ("ALERT".equals(action.getType())) {
                String direction = "GT".equals(rule.getOperator()) ? "above" : "below";
                String message = String.format("Read %.2f, %s threshold of %.2f",
                        currentValue, direction, threshold);
                Alert alert = new Alert();
                alert.setRule(rule);
                alert.setMessage(message);
                alert.setSeverity(action.getSeverity());
                alert.setTriggeredAt(now);
                alert.setAcknowledged(false);
                alertRepository.save(alert);
                log.info("Rule {}: alert saved — {}", rule.getRuleId(), message);
            }
        }

        rule.setLastTriggeredAt(now);
        ruleRepository.save(rule);
    }

    @Scheduled(fixedDelay = AUTO_OFF_SWEEP_INTERVAL_MS)
    @Transactional
    public void processAutoOff() {
        List<RuleAction> due = actionRepository.findByAutoOffAtLessThanEqual(LocalDateTime.now());
        for (RuleAction action : due) {
            DeviceComponent target = action.getTargetComponent();
            if (target != null) {
                String cmdTopic = target.getMqttTopic() + "/set";
                mqttGateway.publish(cmdTopic, "OFF");
                log.info("Auto-off: published 'OFF' to '{}'", cmdTopic);
            }
            action.setAutoOffAt(null);
            actionRepository.save(action);
        }
    }
}
