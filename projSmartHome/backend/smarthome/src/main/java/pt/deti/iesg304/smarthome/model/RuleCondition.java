package pt.deti.iesg304.smarthome.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "rulecondition")
public class RuleCondition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "conditionid")
    private Long conditionId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ruleid", nullable = false, unique = true)
    private AutomationRule rule;

    @Column(name = "type", nullable = false, length = 20)
    private String type;

    @Column(name = "threshold")
    private Double threshold;

    @Column(name = "externalsource", length = 50)
    private String externalSource;

    @Column(name = "offsetvalue")
    private Double offsetValue;
}
