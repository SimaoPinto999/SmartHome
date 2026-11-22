package pt.deti.iesg304.smarthome.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ActivityLogResponse {
    private Long logId;
    private Long houseId;
    private Long componentId;
    private String componentName;
    private String deviceName;
    private Long roomId;
    private String roomName;
    private String eventType;
    private String message;
    private LocalDateTime timestamp;
}
