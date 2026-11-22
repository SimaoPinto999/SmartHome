package pt.deti.iesg304.smarthome.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PermissionResponse {
    private Long permissionId;
    private Long profileId;
    private String deviceId;
    private Long roomId;
    private Integer permissionLevel;
}
