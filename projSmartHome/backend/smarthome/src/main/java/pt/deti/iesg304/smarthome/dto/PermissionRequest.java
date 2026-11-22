package pt.deti.iesg304.smarthome.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class PermissionRequest {
    @NotNull
    private Long profileId;
    private String deviceId;
    private Long roomId;
    private Integer permissionLevel;
}
