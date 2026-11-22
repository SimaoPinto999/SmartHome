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
@Table(name = "ruleaction")
public class RuleAction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "actionid")
    private Long actionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ruleid", nullable = false)
    private AutomationRule rule;

    @Column(name = "type", nullable = false, length = 20)
    private String type;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "targetcomponentid")
    private DeviceComponent targetComponent;

    @Column(name = "value", length = 50)
    private String value;

    @Column(name = "severity", length = 20)
    private String severity;

    @Column(name = "auto_off_minutes")
    private Integer autoOffMinutes;

    @Column(name = "auto_off_at")
    private LocalDateTime autoOffAt;
}
