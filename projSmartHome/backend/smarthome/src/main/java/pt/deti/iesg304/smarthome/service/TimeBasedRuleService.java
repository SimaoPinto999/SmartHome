package pt.deti.iesg304.smarthome.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pt.deti.iesg304.smarthome.config.MqttPublisherConfig;
import pt.deti.iesg304.smarthome.dto.TimeBasedRuleRequest;
import pt.deti.iesg304.smarthome.dto.TimeBasedRuleResponse;
import pt.deti.iesg304.smarthome.exception.ResourceNotFoundException;
import pt.deti.iesg304.smarthome.model.*;
import pt.deti.iesg304.smarthome.repository.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TimeBasedRuleService {

    private final TimeBasedRuleRepository ruleRepository;
    private final AccountRepository accountRepository;
    private final HouseRepository houseRepository;
    private final DeviceComponentRepository componentRepository;
    private final MqttPublisherConfig.MqttGateway mqttGateway;

    public TimeBasedRuleService(TimeBasedRuleRepository ruleRepository,
                                AccountRepository accountRepository,
                                HouseRepository houseRepository,
                                DeviceComponentRepository componentRepository,
                                MqttPublisherConfig.MqttGateway mqttGateway) {
        this.ruleRepository = ruleRepository;
        this.accountRepository = accountRepository;
        this.houseRepository = houseRepository;
        this.componentRepository = componentRepository;
        this.mqttGateway = mqttGateway;
    }

    @Transactional(readOnly = true)
    public List<TimeBasedRuleResponse> getAllRules(String email) {
        House house = resolveHouse(email);
        return ruleRepository.findByHouse_HouseId(house.getHouseId())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TimeBasedRuleResponse getRuleById(Long ruleId, String email) {
        return toResponse(findOwned(ruleId, resolveHouse(email)));
    }

    @Transactional
    public void triggerNow(Long id, String email) {
        TimeBasedRule rule = findOwned(id, resolveHouse(email));
        String topic = rule.getTargetComponent().getMqttTopic() + "/set";
        mqttGateway.publish(topic, rule.getValue());
        rule.setLastTriggeredAt(LocalDateTime.now());
        ruleRepository.save(rule);
    }

    @Transactional
    public TimeBasedRuleResponse createRule(TimeBasedRuleRequest req, String email) {
        House house = resolveHouse(email);
        DeviceComponent target = resolveTarget(req.getTargetComponentId(), house);
        validateReferencePoint(req.getReferencePoint());

        TimeBasedRule rule = new TimeBasedRule();
        rule.setHouse(house);
        rule.setName(req.getName());
        rule.setEnabled(req.getEnabled() != null ? req.getEnabled() : true);
        rule.setReferencePoint(req.getReferencePoint());
        rule.setOffsetMinutes(req.getOffsetMinutes() != null ? req.getOffsetMinutes() : 0);
        rule.setTargetComponent(target);
        rule.setValue(req.getValue());
        rule.setCooldownMinutes(req.getCooldownMinutes() != null ? req.getCooldownMinutes() : 60);
        return toResponse(ruleRepository.save(rule));
    }

    @Transactional
    public TimeBasedRuleResponse updateRule(Long ruleId, TimeBasedRuleRequest req, String email) {
        House house = resolveHouse(email);
        TimeBasedRule rule = findOwned(ruleId, house);
        DeviceComponent target = resolveTarget(req.getTargetComponentId(), house);
        validateReferencePoint(req.getReferencePoint());

        rule.setName(req.getName());
        rule.setReferencePoint(req.getReferencePoint());
        rule.setOffsetMinutes(req.getOffsetMinutes() != null ? req.getOffsetMinutes() : 0);
        rule.setTargetComponent(target);
        rule.setValue(req.getValue());
        rule.setCooldownMinutes(req.getCooldownMinutes() != null ? req.getCooldownMinutes() : 60);
        if (req.getEnabled() != null) rule.setEnabled(req.getEnabled());
        return toResponse(ruleRepository.save(rule));
    }

    @Transactional
    public void deleteRule(Long ruleId, String email) {
        ruleRepository.delete(findOwned(ruleId, resolveHouse(email)));
    }

    @Transactional
    public TimeBasedRuleResponse toggleEnabled(Long ruleId, boolean enabled, String email) {
        TimeBasedRule rule = findOwned(ruleId, resolveHouse(email));
        rule.setEnabled(enabled);
        return toResponse(ruleRepository.save(rule));
    }

    private House resolveHouse(String email) {
        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + email));
        List<House> houses = houseRepository.findByAccount_AccountId(account.getAccountId());
        if (houses.isEmpty()) throw new ResourceNotFoundException("No house found for: " + email);
        return houses.get(0);
    }

    private TimeBasedRule findOwned(Long ruleId, House house) {
        TimeBasedRule rule = ruleRepository.findById(ruleId)
                .orElseThrow(() -> new ResourceNotFoundException("TimeBasedRule not found: " + ruleId));
        if (!rule.getHouse().getHouseId().equals(house.getHouseId()))
            throw new ResourceNotFoundException("TimeBasedRule not found: " + ruleId);
        return rule;
    }

    private DeviceComponent resolveTarget(Long componentId, House house) {
        DeviceComponent target = componentRepository.findById(componentId)
                .orElseThrow(() -> new ResourceNotFoundException("Component not found: " + componentId));
        if (target.getDevice() == null || target.getDevice().getRoom() == null ||
                target.getDevice().getRoom().getHouse() == null ||
                !target.getDevice().getRoom().getHouse().getHouseId().equals(house.getHouseId())) {
            throw new IllegalArgumentException("Component does not belong to this house");
        }
        if (!"ACTUATOR".equalsIgnoreCase(target.getComponentType())) {
            throw new IllegalArgumentException("Target component is not an actuator");
        }
        return target;
    }

    private void validateReferencePoint(String ref) {
        if (!"SUNSET".equals(ref) && !"SUNRISE".equals(ref)) {
            throw new IllegalArgumentException("referencePoint must be SUNSET or SUNRISE");
        }
    }

    private TimeBasedRuleResponse toResponse(TimeBasedRule rule) {
        return new TimeBasedRuleResponse(
                rule.getRuleId(),
                rule.getHouse().getHouseId(),
                rule.getName(),
                rule.getEnabled(),
                rule.getReferencePoint(),
                rule.getOffsetMinutes(),
                rule.getTargetComponent().getComponentId(),
                rule.getTargetComponent().getComponentName(),
                rule.getValue(),
                rule.getCooldownMinutes(),
                rule.getLastTriggeredAt()
        );
    }

    
}