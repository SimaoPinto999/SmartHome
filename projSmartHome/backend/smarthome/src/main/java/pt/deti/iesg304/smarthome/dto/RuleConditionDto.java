package pt.deti.iesg304.smarthome.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RuleConditionDto {
    private String type;
    private Double threshold;
    private String externalSource;
    private Double offsetValue;
}
