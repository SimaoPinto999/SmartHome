package pt.deti.iesg304.smarthome.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class EnergyPriceResponse {
    private Long priceId;
    private BigDecimal pricePerKwh;
    private LocalDateTime validFrom;
}