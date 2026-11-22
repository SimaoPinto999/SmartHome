package pt.deti.iesg304.smarthome.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class RoomRequest {
    private Long houseId;
    private String roomName;
    private String roomType;
    private Integer floor;
}
