package pt.deti.iesg304.smarthome.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AutomationRuleResponse {
    private Long ruleId;
    private Long houseId;
    private Long sensorComponentId;
    private String sensorComponentName;
    private String sensorType;
    private String name;
    private String operator;
    private Integer cooldownMinutes;
    private LocalDateTime lastTriggeredAt;
    private Boolean enabled;
    private RuleConditionDto condition;
    private List<RuleActionDto> actions;
}
