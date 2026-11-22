package pt.deti.iesg304.smarthome.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pt.deti.iesg304.smarthome.config.MqttPublisherConfig;
import pt.deti.iesg304.smarthome.model.TimeBasedRule;
import pt.deti.iesg304.smarthome.repository.TimeBasedRuleRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;

@Service
public class TimeBasedRuleEvaluator {

    private static final Logger log = LoggerFactory.getLogger(TimeBasedRuleEvaluator.class);
    private static final int WINDOW_SECONDS = 30;

    private final TimeBasedRuleRepository ruleRepository;
    private final WeatherService weatherService;
    private final MqttPublisherConfig.MqttGateway mqttGateway;

    public TimeBasedRuleEvaluator(TimeBasedRuleRepository ruleRepository,
                                   WeatherService weatherService,
                                   MqttPublisherConfig.MqttGateway mqttGateway) {
        this.ruleRepository = ruleRepository;
        this.weatherService = weatherService;
        this.mqttGateway = mqttGateway;
    }

    @Scheduled(fixedRate = 60_000)
    @Transactional
    public void evaluate() {
        LocalTime sunset  = weatherService.getSunset();
        LocalTime sunrise = weatherService.getSunrise();

        List<TimeBasedRule> rules = ruleRepository.findByEnabledTrue();
        for (TimeBasedRule rule : rules) {
            try {
                evaluateRule(rule, sunset, sunrise);
            } catch (Exception e) {
                log.error("Error evaluating TimeBasedRule {}: {}", rule.getRuleId(), e.getMessage());
            }
        }
    }

    private void evaluateRule(TimeBasedRule rule, LocalTime sunset, LocalTime sunrise) {
        ZoneId zone = zoneOf(rule.getHouse().getTimezone());
        ZonedDateTime zonedNow = ZonedDateTime.now(zone);
        LocalTime now  = zonedNow.toLocalTime();
        LocalDate today = zonedNow.toLocalDate();

        LocalTime reference = "SUNRISE".equals(rule.getReferencePoint()) ? sunrise : sunset;
        LocalTime target = reference.plusMinutes(rule.getOffsetMinutes());

        long diff = Math.abs(now.toSecondOfDay() - target.toSecondOfDay());
        long diffSeconds = Math.min(diff, 86400 - diff);
        if (diffSeconds > WINDOW_SECONDS) return;

        // Don't re-fire within cooldown window
        if (rule.getLastTriggeredAt() != null) {
            LocalDateTime cooldownExpiry = rule.getLastTriggeredAt().plusMinutes(rule.getCooldownMinutes());
            if (today.atTime(now).isBefore(cooldownExpiry)) return;
        }

        String topic = rule.getTargetComponent().getMqttTopic() + "/set";
        mqttGateway.publish(topic, rule.getValue());
        rule.setLastTriggeredAt(today.atTime(now));
        ruleRepository.save(rule);
        log.info("TimeBasedRule {}: published '{}' to '{}'", rule.getRuleId(), rule.getValue(), topic);
    }

    private ZoneId zoneOf(String timezone) {
        try {
            return ZoneId.of(timezone != null ? timezone : "Europe/Lisbon");
        } catch (Exception e) {
            return ZoneId.of("Europe/Lisbon");
        }
    }
}
