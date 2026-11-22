package pt.deti.iesg304.smarthome.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pt.deti.iesg304.smarthome.dto.AutomationRuleRequest;
import pt.deti.iesg304.smarthome.dto.AutomationRuleResponse;
import pt.deti.iesg304.smarthome.dto.RuleActionDto;
import pt.deti.iesg304.smarthome.dto.RuleConditionDto;
import pt.deti.iesg304.smarthome.exception.ResourceNotFoundException;
import pt.deti.iesg304.smarthome.model.*;
import pt.deti.iesg304.smarthome.repository.*;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AutomationService {

    private final AutomationRuleRepository ruleRepository;
    private final RuleConditionRepository conditionRepository;
    private final RuleActionRepository actionRepository;
    private final AccountRepository accountRepository;
    private final HouseRepository houseRepository;
    private final DeviceComponentRepository componentRepository;

    public AutomationService(AutomationRuleRepository ruleRepository,
                              RuleConditionRepository conditionRepository,
                              RuleActionRepository actionRepository,
                              AccountRepository accountRepository,
                              HouseRepository houseRepository,
                              DeviceComponentRepository componentRepository) {
        this.ruleRepository = ruleRepository;
        this.conditionRepository = conditionRepository;
        this.actionRepository = actionRepository;
        this.accountRepository = accountRepository;
        this.houseRepository = houseRepository;
        this.componentRepository = componentRepository;
    }

    private House resolveHouse(String email) {
        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + email));
        List<House> houses = houseRepository.findByAccount_AccountId(account.getAccountId());
        if (houses.isEmpty()) throw new ResourceNotFoundException("No house found for: " + email);
        return houses.get(0);
    }

    @Transactional(readOnly = true)
    public List<AutomationRuleResponse> getAllRules(String email) {
        House house = resolveHouse(email);
        return ruleRepository.findByHouse_HouseId(house.getHouseId())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AutomationRuleResponse getRuleById(Long ruleId, String email) {
        House house = resolveHouse(email);
        AutomationRule rule = ruleRepository.findById(ruleId)
                .orElseThrow(() -> new ResourceNotFoundException("Rule not found: " + ruleId));
        if (!rule.getHouse().getHouseId().equals(house.getHouseId()))
            throw new ResourceNotFoundException("Rule not found: " + ruleId);
        return toResponse(rule);
    }

    @Transactional
    public AutomationRuleResponse createRule(AutomationRuleRequest request, String email) {
        House house = resolveHouse(email);
        DeviceComponent sensor = componentRepository.findById(request.getSensorComponentId())
                .orElseThrow(() -> new ResourceNotFoundException("Component not found: " + request.getSensorComponentId()));

        if (sensor.getDevice() == null || sensor.getDevice().getRoom() == null ||
                sensor.getDevice().getRoom().getHouse() == null ||
                !sensor.getDevice().getRoom().getHouse().getHouseId().equals(house.getHouseId())) {
            throw new IllegalArgumentException("Sensor component does not belong to this house");
        }

        if (!"SENSOR".equalsIgnoreCase(sensor.getComponentType())) {
            throw new IllegalArgumentException("Component is not a sensor");
        }

        AutomationRule rule = new AutomationRule();
        rule.setHouse(house);
        rule.setSensorComponent(sensor);
        rule.setName(request.getName());
        rule.setOperator(request.getOperator());
        rule.setCooldownMinutes(request.getCooldownMinutes() != null ? request.getCooldownMinutes() : 5);
        rule.setEnabled(request.getEnabled() != null ? request.getEnabled() : true);
        AutomationRule saved = ruleRepository.save(rule);

        saveCondition(saved, request.getCondition());
        saveActions(saved, request.getActions());

        return toResponse(saved);
    }

    @Transactional
    public AutomationRuleResponse updateRule(Long ruleId, AutomationRuleRequest request, String email) {
        House house = resolveHouse(email);
        AutomationRule rule = ruleRepository.findById(ruleId)
                .orElseThrow(() -> new ResourceNotFoundException("Rule not found: " + ruleId));
        if (!rule.getHouse().getHouseId().equals(house.getHouseId()))
            throw new ResourceNotFoundException("Rule not found: " + ruleId);

        DeviceComponent sensor = componentRepository.findById(request.getSensorComponentId())
                .orElseThrow(() -> new ResourceNotFoundException("Component not found: " + request.getSensorComponentId()));

        if (sensor.getDevice() == null || sensor.getDevice().getRoom() == null ||
                sensor.getDevice().getRoom().getHouse() == null ||
                !sensor.getDevice().getRoom().getHouse().getHouseId().equals(house.getHouseId())) {
            throw new IllegalArgumentException("Sensor component does not belong to this house");
        }

        if (!"SENSOR".equalsIgnoreCase(sensor.getComponentType())) {
            throw new IllegalArgumentException("Component is not a sensor");
        }

        rule.setSensorComponent(sensor);
        rule.setName(request.getName());
        rule.setOperator(request.getOperator());
        rule.setCooldownMinutes(request.getCooldownMinutes() != null ? request.getCooldownMinutes() : 5);
        if (request.getEnabled() != null) rule.setEnabled(request.getEnabled());
        ruleRepository.save(rule);

        conditionRepository.findByRule_RuleId(ruleId).ifPresent(conditionRepository::delete);
        conditionRepository.flush();
        actionRepository.deleteAll(actionRepository.findByRule_RuleId(ruleId));
        actionRepository.flush();

        saveCondition(rule, request.getCondition());
        saveActions(rule, request.getActions());

        return toResponse(rule);
    }

    @Transactional
    public void deleteRule(Long ruleId, String email) {
        House house = resolveHouse(email);
        AutomationRule rule = ruleRepository.findById(ruleId)
                .orElseThrow(() -> new ResourceNotFoundException("Rule not found: " + ruleId));
        if (!rule.getHouse().getHouseId().equals(house.getHouseId()))
            throw new ResourceNotFoundException("Rule not found: " + ruleId);
        ruleRepository.delete(rule);
    }

    @Transactional
    public AutomationRuleResponse toggleEnabled(Long ruleId, boolean enabled, String email) {
        House house = resolveHouse(email);
        AutomationRule rule = ruleRepository.findById(ruleId)
                .orElseThrow(() -> new ResourceNotFoundException("Rule not found: " + ruleId));
        if (!rule.getHouse().getHouseId().equals(house.getHouseId()))
            throw new ResourceNotFoundException("Rule not found: " + ruleId);
        rule.setEnabled(enabled);
        return toResponse(ruleRepository.save(rule));
    }

    private void saveCondition(AutomationRule rule, RuleConditionDto dto) {
        if (dto == null) return;
        RuleCondition condition = new RuleCondition();
        condition.setRule(rule);
        condition.setType(dto.getType());
        condition.setThreshold(dto.getThreshold());
        condition.setExternalSource(dto.getExternalSource());
        condition.setOffsetValue(dto.getOffsetValue());
        conditionRepository.save(condition);
    }

    private void saveActions(AutomationRule rule, List<RuleActionDto> dtos) {
        if (dtos == null) return;
        House house = rule.getHouse();
        for (RuleActionDto dto : dtos) {
            RuleAction action = new RuleAction();
            action.setRule(rule);
            action.setType(dto.getType());
            action.setValue(dto.getValue());
            action.setSeverity(dto.getSeverity());
            action.setAutoOffMinutes(dto.getAutoOffMinutes());
            if (dto.getTargetComponentId() != null) {
                DeviceComponent target = componentRepository.findById(dto.getTargetComponentId())
                        .orElseThrow(() -> new ResourceNotFoundException("Target component not found: " + dto.getTargetComponentId()));

                if (target.getDevice() == null || target.getDevice().getRoom() == null ||
                        target.getDevice().getRoom().getHouse() == null ||
                        !target.getDevice().getRoom().getHouse().getHouseId().equals(house.getHouseId())) {
                    throw new IllegalArgumentException("Target component does not belong to this house");
                }

                if (!"ACTUATOR".equalsIgnoreCase(target.getComponentType())) {
                    throw new IllegalArgumentException("Target component is not an actuator");
                }

                action.setTargetComponent(target);
            }
            actionRepository.save(action);
        }
    }

    private AutomationRuleResponse toResponse(AutomationRule rule) {
        RuleConditionDto conditionDto = conditionRepository.findByRule_RuleId(rule.getRuleId())
                .map(c -> new RuleConditionDto(c.getType(), c.getThreshold(), c.getExternalSource(), c.getOffsetValue()))
                .orElse(null);

        List<RuleActionDto> actionDtos = actionRepository.findByRule_RuleId(rule.getRuleId())
                .stream().map(a -> new RuleActionDto(
                        a.getActionId(),
                        a.getType(),
                        a.getTargetComponent() != null ? a.getTargetComponent().getComponentId() : null,
                        a.getTargetComponent() != null ? a.getTargetComponent().getComponentName() : null,
                        a.getValue(),
                        a.getSeverity(),
                        a.getAutoOffMinutes()
                )).collect(Collectors.toList());

        DeviceComponent sensor = rule.getSensorComponent();
        return new AutomationRuleResponse(
                rule.getRuleId(),
                rule.getHouse().getHouseId(),
                sensor.getComponentId(),
                sensor.getComponentName(),
                sensor.getSensorType(),
                rule.getName(),
                rule.getOperator(),
                rule.getCooldownMinutes(),
                rule.getLastTriggeredAt(),
                rule.getEnabled(),
                conditionDto,
                actionDtos
        );
    }
}
