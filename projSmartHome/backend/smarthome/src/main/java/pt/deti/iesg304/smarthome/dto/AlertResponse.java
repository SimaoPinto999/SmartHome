package pt.deti.iesg304.smarthome.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AlertResponse {
    private Long alertId;
    private Long ruleId;
    private String ruleName;
    private String message;
    private String severity;
    private LocalDateTime triggeredAt;
    private Boolean acknowledged;
    private String alertType;
}
