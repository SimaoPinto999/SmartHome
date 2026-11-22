package pt.deti.iesg304.smarthome.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "timebasedrule")
public class TimeBasedRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ruleid")
    private Long ruleId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "houseid", nullable = false)
    private House house;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "enabled", nullable = false)
    private Boolean enabled = true;

    @Column(name = "referencepoint", nullable = false, length = 10)
    private String referencePoint;

    @Column(name = "offsetminutes", nullable = false)
    private Integer offsetMinutes = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "targetcomponentid", nullable = false)
    private DeviceComponent targetComponent;

    @Column(name = "value", nullable = false, length = 50)
    private String value;

    @Column(name = "cooldownminutes", nullable = false)
    private Integer cooldownMinutes = 60;

    @Column(name = "lasttriggeredat")
    private LocalDateTime lastTriggeredAt;
}