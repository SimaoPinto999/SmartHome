package pt.deti.iesg304.smarthome.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record EnergyPriceRequest(
        @NotNull @Positive BigDecimal pricePerKwh
) {}
