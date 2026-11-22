package pt.deti.iesg304.smarthome.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class HouseResponse {
    private Long houseId;
    private Long accountId;
    private String houseName;
    private String address;
    private String timezone;
    private Boolean alarmArmed;
}
