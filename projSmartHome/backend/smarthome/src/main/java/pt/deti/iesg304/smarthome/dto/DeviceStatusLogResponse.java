package pt.deti.iesg304.smarthome.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DeviceStatusLogResponse {
    private Long logId;
    private String deviceId;
    private String statusValue;
    private LocalDateTime timestamp;
}
