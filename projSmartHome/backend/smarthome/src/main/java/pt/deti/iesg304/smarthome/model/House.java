package pt.deti.iesg304.smarthome.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "house")
public class House {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "houseid")
    private Long houseId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "accountid", nullable = false)
    private Account account;

    @Column(name = "housename", nullable = false, length = 150)
    private String houseName;

    @Column(name = "address")
    private String address;

    @Column(name = "timezone", length = 50)
    private String timezone = "UTC";

    @Column(name = "alarmarmed", nullable = false)
    private Boolean alarmArmed = false;
}
