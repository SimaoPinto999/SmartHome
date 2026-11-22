package pt.deti.iesg304.smarthome.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import pt.deti.iesg304.smarthome.model.Role;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProfileResponse {
    private Long profileId;
    private Long accountId;
    private String firstName;
    private String lastName;
    private Role role;
}
