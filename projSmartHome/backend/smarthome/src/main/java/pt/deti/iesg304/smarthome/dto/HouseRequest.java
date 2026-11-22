package pt.deti.iesg304.smarthome.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class HouseRequest {
    private Long accountId;
    private String houseName;
    private String address;
    private String timezone;
}
