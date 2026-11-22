package pt.deti.iesg304.smarthome.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TimeBasedRuleResponse {
    private Long ruleId;
    private Long houseId;
    private String name;
    private Boolean enabled;
    private String referencePoint;
    private Integer offsetMinutes;
    private Long targetComponentId;
    private String targetComponentName;
    private String value;
    private Integer cooldownMinutes;
    private LocalDateTime lastTriggeredAt;
}
