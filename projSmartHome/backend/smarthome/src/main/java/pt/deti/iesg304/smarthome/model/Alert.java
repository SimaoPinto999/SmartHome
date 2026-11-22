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
@Table(name = "alert")
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "alertid")
    private Long alertId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ruleid", nullable = false)
    private AutomationRule rule;

    @Column(name = "message", nullable = false, length = 255)
    private String message;

    @Column(name = "severity", nullable = false, length = 20)
    private String severity;

    @Column(name = "triggeredat", nullable = false)
    private LocalDateTime triggeredAt;

    @Column(name = "acknowledged", nullable = false)
    private Boolean acknowledged = false;

    @Column(name = "alerttype", nullable = false, length = 30)
    private String alertType = "AUTOMATION";
}
