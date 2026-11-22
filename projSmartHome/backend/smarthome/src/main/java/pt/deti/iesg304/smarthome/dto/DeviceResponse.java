package pt.deti.iesg304.smarthome.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DeviceResponse {
    private String deviceId;
    private Long roomId;
    private String deviceName;
    private String deviceType;
    private String status;
    private RoomResponse room;
}
