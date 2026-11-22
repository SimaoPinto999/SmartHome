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
@Table(name = "automationrule")
public class AutomationRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ruleid")
    private Long ruleId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "houseid", nullable = false)
    private House house;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sensorcomponentid", nullable = false)
    private DeviceComponent sensorComponent;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "operator", nullable = false, length = 2)
    private String operator;

    @Column(name = "cooldownminutes", nullable = false)
    private Integer cooldownMinutes = 5;

    @Column(name = "lasttriggeredat")
    private LocalDateTime lastTriggeredAt;

    @Column(name = "enabled", nullable = false)
    private Boolean enabled = true;
}
