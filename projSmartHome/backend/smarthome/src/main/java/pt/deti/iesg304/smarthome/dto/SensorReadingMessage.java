package pt.deti.iesg304.smarthome.dto;

import java.time.Instant;

public record SensorReadingMessage(
        Long componentId,
        String value,
        String unit,
        String measurement,
        Instant timestamp
) {}
