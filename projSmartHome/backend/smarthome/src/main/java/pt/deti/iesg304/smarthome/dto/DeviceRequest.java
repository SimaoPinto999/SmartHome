package pt.deti.iesg304.smarthome.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class DeviceRequest {
    @NotNull
    private Long roomId;

    @NotBlank @Size(max = 100)
    private String deviceName;

    @NotBlank
    private String deviceType;
}
