package pt.deti.iesg304.smarthome.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "devicecomponent")
public class DeviceComponent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "componentid")
    private Long componentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deviceid", nullable = false)
    private Device device;

    @Column(name = "componentname", length = 150)
    private String componentName;

    @Column(name = "componenttype", length = 50)
    private String componentType;

    @Column(name = "sensortype", length = 50)
    private String sensorType;

    @Column(name = "actuatortype", length = 50)
    private String actuatorType;

    @Column(name = "unit", length = 20)
    private String unit;

    @Column(name = "mqtttopic", unique = true, nullable = false, length = 255)
    private String mqttTopic;

    /**
     * Nominal power consumption in Watts when the component is active.
     * Used for monthly consumption forecasts.
     * Null means no forecast is available for this component.
     */
    @Column(name = "nominal_watts")
    private BigDecimal nominalWatts;
}