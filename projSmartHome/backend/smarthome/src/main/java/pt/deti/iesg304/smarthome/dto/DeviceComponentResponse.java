package pt.deti.iesg304.smarthome.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DeviceComponentResponse {
    private Long componentId;
    private String deviceId;
    private String componentName;
    private String componentType;
    private String sensorType;
    private String actuatorType;
    private String unit;
    private String mqttTopic;
    private BigDecimal nominalWatts;
}