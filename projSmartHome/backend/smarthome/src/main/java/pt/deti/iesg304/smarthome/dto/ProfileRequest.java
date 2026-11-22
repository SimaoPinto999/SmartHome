package pt.deti.iesg304.smarthome.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;
import pt.deti.iesg304.smarthome.model.Role;

@Data
@NoArgsConstructor
public class ProfileRequest {
    @NotNull
    private Long accountId;

    @NotBlank @Size(max = 100)
    private String firstName;
    
    @Size(max = 100)
    private String lastName;

    @NotNull
    private Role role;

    @Pattern(regexp = "\\d{4}")
    private String pin;
}
