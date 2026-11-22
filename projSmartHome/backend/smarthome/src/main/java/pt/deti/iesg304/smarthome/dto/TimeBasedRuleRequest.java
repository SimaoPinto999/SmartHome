package pt.deti.iesg304.smarthome.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TimeBasedRuleRequest {
    private String name;
    private String referencePoint;   // SUNSET | SUNRISE
    private Integer offsetMinutes;   // negative = before, positive = after
    private Long targetComponentId;
    private String value;
    private Integer cooldownMinutes;
    private Boolean enabled;
}