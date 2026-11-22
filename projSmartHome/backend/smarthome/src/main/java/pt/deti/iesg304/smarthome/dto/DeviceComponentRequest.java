package pt.deti.iesg304.smarthome.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
public class DeviceComponentRequest {
    private String deviceId;
    private String componentName;
    private String componentType;
    private String sensorType;
    private String actuatorType;
    private String unit;
    private String mqttTopic;
    private BigDecimal nominalWatts;
}