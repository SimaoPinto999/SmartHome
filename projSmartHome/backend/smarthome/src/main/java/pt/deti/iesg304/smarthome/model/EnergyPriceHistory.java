package pt.deti.iesg304.smarthome.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "energypricehistory")
public class EnergyPriceHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "priceid")
    private Long priceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "houseid", nullable = false)
    private House house;

    @Column(name = "priceperkwh", nullable = false, precision = 6, scale = 4)
    private BigDecimal pricePerKwh;

    @Column(name = "validfrom", nullable = false)
    private LocalDateTime validFrom;
    
}