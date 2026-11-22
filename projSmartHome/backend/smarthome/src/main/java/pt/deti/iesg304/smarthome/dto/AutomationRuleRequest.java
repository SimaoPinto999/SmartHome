package pt.deti.iesg304.smarthome.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AutomationRuleRequest {
    private Long sensorComponentId;
    private String name;
    private String operator;
    private Integer cooldownMinutes;
    private Boolean enabled;
    private RuleConditionDto condition;
    private List<RuleActionDto> actions;
}
