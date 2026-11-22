package pt.deti.iesg304.smarthome.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class EnergySummaryResponse {
    private Double totalKwh;
    private BigDecimal totalCost;
    private BigDecimal pricePerKwh;
    private LocalDateTime periodStart;
    private LocalDateTime periodEnd;
    private List<EnergyDeviceResponse> devices;
}