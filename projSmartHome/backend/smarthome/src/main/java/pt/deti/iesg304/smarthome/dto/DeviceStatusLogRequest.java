package pt.deti.iesg304.smarthome.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class DeviceStatusLogRequest {
    private String deviceId;
    private String statusValue;
}
