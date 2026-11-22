package pt.deti.iesg304.smarthome.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class EnergyDeviceResponse {
    private Long componentId;
    private String componentName;
    private String componentType;
    private String sensorType;
    private String actuatorType;
    private String deviceId;
    private String deviceName;
    private String roomName;
    private Double consumptionKwh;
    private BigDecimal estimatedCost;
}