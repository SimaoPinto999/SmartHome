package pt.deti.iesg304.smarthome.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AccountResponse {
    private Long accountId;
    private String email;
    private LocalDateTime createdAt;
}
