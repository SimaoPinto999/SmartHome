package pt.deti.iesg304.smarthome.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RuleActionDto {
    private Long actionId;
    private String type;
    private Long targetComponentId;
    private String targetComponentName;
    private String value;
    private String severity;
    private Integer autoOffMinutes;
}
