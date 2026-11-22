package pt.deti.iesg304.smarthome.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "device")
public class Device {

    @Id
    @Column(name = "deviceid", length = 100)
    private String deviceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "roomid", nullable = false)
    private Room room;

    @Column(name = "devicename", nullable = false, length = 150)
    private String deviceName;

    @Column(name = "devicetype", length = 50)
    private String deviceType;

    @Column(name = "status", length = 50)
    private String status = "ONLINE";
}
