package pt.deti.iesg304.smarthome.service;

import com.influxdb.client.InfluxDBClient;
import com.influxdb.client.QueryApi;
import com.influxdb.query.FluxRecord;
import com.influxdb.query.FluxTable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import pt.deti.iesg304.smarthome.dto.EnergyDeviceResponse;
import pt.deti.iesg304.smarthome.dto.EnergyPriceResponse;
import pt.deti.iesg304.smarthome.dto.EnergySummaryResponse;
import pt.deti.iesg304.smarthome.dto.MetricPointDto;
import pt.deti.iesg304.smarthome.exception.ResourceNotFoundException;
import pt.deti.iesg304.smarthome.model.DeviceComponent;
import pt.deti.iesg304.smarthome.model.EnergyPriceHistory;
import pt.deti.iesg304.smarthome.model.House;
import pt.deti.iesg304.smarthome.repository.DeviceComponentRepository;
import pt.deti.iesg304.smarthome.repository.EnergyPriceHistoryRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class EnergyService {

    private static final Logger log = LoggerFactory.getLogger(EnergyService.class);

    private static final BigDecimal DEFAULT_PRICE_PER_KWH = BigDecimal.valueOf(0.1934);

    private static final String MEASUREMENT_SENSOR   = "sensor_reading";
    private static final String MEASUREMENT_ACTUATOR = "actuator_state";

    private final InfluxDBClient influxDBClient;
    private final DeviceComponentRepository componentRepository;
    private final EnergyPriceHistoryRepository priceRepository;
    private final HouseResolver houseResolver;

    @Value("${influxdb.bucket}") private String bucket;
    @Value("${influxdb.org}")    private String org;

    public EnergyService(InfluxDBClient influxDBClient,
                         DeviceComponentRepository componentRepository,
                         EnergyPriceHistoryRepository priceRepository,
                         HouseResolver houseResolver) {
        this.influxDBClient = influxDBClient;
        this.componentRepository = componentRepository;
        this.priceRepository = priceRepository;
        this.houseResolver = houseResolver;
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private List<DeviceComponent> getActiveComponents(Long houseId) {
        // Components with explicit nominalWatts > 0 (actuators + non-power sensors)
        List<DeviceComponent> withWatts = componentRepository
                .findByDevice_Room_House_HouseIdAndNominalWattsGreaterThan(houseId, BigDecimal.ZERO);

        // POWER sensors use real measured values — include them regardless of nominalWatts
        List<DeviceComponent> powerSensors = componentRepository
                .findByDevice_Room_House_HouseIdAndSensorType(houseId, "POWER");

        List<DeviceComponent> active = new ArrayList<>(withWatts);
        for (DeviceComponent ps : powerSensors) {
            if (active.stream().noneMatch(c -> c.getComponentId().equals(ps.getComponentId()))) {
                active.add(ps);
            }
        }

        List<DeviceComponent> skipped = componentRepository
                .findByDevice_Room_House_HouseId(houseId).stream()
                .filter(c -> !active.contains(c))
                .toList();

        if (!skipped.isEmpty()) {
            log.warn("Skipping {} component(s) with no nominalWatts for houseId={}: {}",
                    skipped.size(), houseId,
                    skipped.stream().map(DeviceComponent::getComponentName).collect(Collectors.joining(", ")));
        }

        return active;
    }

    private BigDecimal resolvePrice(Long houseId, LocalDateTime start) {
        LocalDateTime now = LocalDateTime.now();
        boolean isCurrentMonth = start.getYear() == now.getYear()
                && start.getMonth() == now.getMonth();

        if (isCurrentMonth) {
            return priceRepository.findCurrentPrice(houseId)
                    .map(EnergyPriceHistory::getPricePerKwh)
                    .orElse(DEFAULT_PRICE_PER_KWH);
        }

        return priceRepository.findPriceAt(houseId, start)
                .map(EnergyPriceHistory::getPricePerKwh)
                .orElseGet(() -> priceRepository.findCurrentPrice(houseId)
                        .map(EnergyPriceHistory::getPricePerKwh)
                        .orElse(DEFAULT_PRICE_PER_KWH));
    }

    // ─── Price management ─────────────────────────────────────────────────────

    public EnergyPriceResponse getCurrentPrice(String email) {
        House house = houseResolver.resolve(email);
        EnergyPriceHistory price = priceRepository.findCurrentPrice(house.getHouseId())
                .orElseThrow(() -> new ResourceNotFoundException("No price configured for this house"));
        return new EnergyPriceResponse(price.getPriceId(), price.getPricePerKwh(), price.getValidFrom());
    }

    public List<EnergyPriceResponse> getPriceHistory(String email) {
        House house = houseResolver.resolve(email);
        return priceRepository.findByHouse_HouseIdOrderByValidFromDesc(house.getHouseId())
                .stream()
                .map(p -> new EnergyPriceResponse(p.getPriceId(), p.getPricePerKwh(), p.getValidFrom()))
                .collect(Collectors.toList());
    }

    public EnergyPriceResponse addPrice(String email, BigDecimal pricePerKwh) {
        House house = houseResolver.resolve(email);
        EnergyPriceHistory entry = new EnergyPriceHistory();
        entry.setHouse(house);
        entry.setPricePerKwh(pricePerKwh);
        entry.setValidFrom(LocalDateTime.now());
        EnergyPriceHistory saved = priceRepository.save(entry);
        return new EnergyPriceResponse(saved.getPriceId(), saved.getPricePerKwh(), saved.getValidFrom());
    }

    // ─── Consumption summary ──────────────────────────────────────────────────

    public EnergySummaryResponse getSummary(String email, LocalDateTime start, LocalDateTime end) {
        House house = houseResolver.resolve(email);
        BigDecimal pricePerKwh = resolvePrice(house.getHouseId(), start);
        List<DeviceComponent> components = getActiveComponents(house.getHouseId());

        double totalKwh = 0.0;
        List<EnergyDeviceResponse> breakdown = new ArrayList<>();

        for (DeviceComponent component : components) {
            double kwh = round(queryKwh(component, start, end), 4);
            totalKwh += kwh;

            breakdown.add(new EnergyDeviceResponse(
                    component.getComponentId(),
                    component.getComponentName(),
                    component.getComponentType(),
                    component.getSensorType(),
                    component.getActuatorType(),
                    component.getDevice().getDeviceId(),
                    component.getDevice().getDeviceName(),
                    component.getDevice().getRoom().getRoomName(),
                    kwh,
                    BigDecimal.valueOf(kwh).multiply(pricePerKwh).setScale(4, RoundingMode.HALF_UP)
            ));
        }

        return new EnergySummaryResponse(
                round(totalKwh, 4),
                BigDecimal.valueOf(totalKwh).multiply(pricePerKwh).setScale(4, RoundingMode.HALF_UP),
                pricePerKwh,
                start,
                end,
                breakdown
        );
    }

    // ─── Chart data ───────────────────────────────────────────────────────────

    /**
     * Returns kWh consumed within each time slot (bar resets per interval).
     *
     * Each point's value = kWh consumed only during that slot's window.
     * sum(all bars) == summary.totalKwh for the same period.
     *
     * Uses a single-pass sweep per component so that ON state carries across
     * slot boundaries correctly — avoids the zero-uptime bug that occurs when
     * a device has no events within a slot but was already ON before it started.
     */
    public List<MetricPointDto> getChartData(String email, LocalDateTime start, LocalDateTime end, String interval) {
        House house = houseResolver.resolve(email);
        List<DeviceComponent> components = getActiveComponents(house.getHouseId());

        if (components.isEmpty()) return Collections.emptyList();

        long windowSecs = (long)(parseDurationToHours(interval) * 3600);
        long startEpoch = start.toInstant(ZoneOffset.UTC).getEpochSecond();
        long endEpoch   = end.toInstant(ZoneOffset.UTC).getEpochSecond();

        int numSlots = (int) Math.ceil((double)(endEpoch - startEpoch) / windowSecs);
        if (numSlots <= 0) return Collections.emptyList();

        double[] slotKwh = new double[numSlots];

        // Query from 48h before start so we can determine carry-in state without an extra query.
        LocalDateTime queryStart = start.minusHours(48);

        for (DeviceComponent component : components) {
            List<double[]> allEvents = queryRawEvents(component, queryStart, end);

            // Determine carry-in power (kW) from events before startEpoch.
            double carryInKw = 0.0;
            int evIdx = 0;
            for (; evIdx < allEvents.size(); evIdx++) {
                if (allEvents.get(evIdx)[0] < startEpoch) {
                    carryInKw = allEvents.get(evIdx)[1];
                } else {
                    break;
                }
            }

            // Single-pass sweep across slots integrating kW × time directly.
            double powerKw = carryInKw;
            double pos     = startEpoch;

            for (int si = 0; si < numSlots; si++) {
                long   slotStart  = startEpoch + (long) si * windowSecs;
                long   slotEnd    = Math.min(slotStart + windowSecs, endEpoch);
                double slotEnergy = 0.0;

                pos = slotStart;

                while (evIdx < allEvents.size() && allEvents.get(evIdx)[0] < slotEnd) {
                    double evTime = allEvents.get(evIdx)[0];
                    slotEnergy += powerKw * (evTime - pos) / 3600.0;
                    pos     = evTime;
                    powerKw = allEvents.get(evIdx)[1];
                    evIdx++;
                }

                slotEnergy += powerKw * (slotEnd - pos) / 3600.0;
                slotKwh[si] += slotEnergy;
            }
        }

        List<MetricPointDto> result = new ArrayList<>();
        for (int si = 0; si < numSlots; si++) {
            result.add(new MetricPointDto(
                    Instant.ofEpochSecond(startEpoch + (long) si * windowSecs).toString(),
                    String.valueOf(round(slotKwh[si], 6))
            ));
        }
        return result;
    }

    // ─── InfluxDB helpers ─────────────────────────────────────────────────────

    /**
     * Calculates kWh consumed by a component over [start, end].
     *
     * Queries from 48h before start to capture carry-in power — i.e. the power
     * level already in effect at the start of the period. Integrates actual kW
     * values over time, so POWER sensors use real readings rather than nominalWatts.
     */
    private double queryKwh(DeviceComponent component, LocalDateTime start, LocalDateTime end) {
        long startEpoch = start.toInstant(ZoneOffset.UTC).getEpochSecond();
        long endEpoch   = end.toInstant(ZoneOffset.UTC).getEpochSecond();

        LocalDateTime queryStart = start.minusHours(48);
        List<double[]> allEvents = queryRawEvents(component, queryStart, end);

        // Determine carry-in power (kW) from events before startEpoch.
        double carryInKw = 0.0;
        int evIdx = 0;
        for (; evIdx < allEvents.size(); evIdx++) {
            if (allEvents.get(evIdx)[0] < startEpoch) {
                carryInKw = allEvents.get(evIdx)[1];
            } else {
                break;
            }
        }

        double totalKwh = 0.0;
        double pos      = startEpoch;
        double powerKw  = carryInKw;

        for (; evIdx < allEvents.size(); evIdx++) {
            double evTime = allEvents.get(evIdx)[0];
            totalKwh += powerKw * (evTime - pos) / 3600.0;
            pos     = evTime;
            powerKw = allEvents.get(evIdx)[1];
        }

        totalKwh += powerKw * (endEpoch - pos) / 3600.0;
        return totalKwh;
    }

    /**
     * Fetches all raw events for a component over [start, end], sorted ascending by time.
     * Returns pairs of [epochSeconds, activeFlag] where activeFlag is 0 or 1.
     */
    private List<double[]> queryRawEvents(DeviceComponent component, LocalDateTime start, LocalDateTime end) {
        String startStr = start.toInstant(ZoneOffset.UTC).toString();
        String endStr   = end.toInstant(ZoneOffset.UTC).toString();

        String measurement = "ACTUATOR".equals(component.getComponentType())
                ? MEASUREMENT_ACTUATOR : MEASUREMENT_SENSOR;

        String flux = String.format("""
                from(bucket: "%s")
                  |> range(start: %s, stop: %s)
                  |> filter(fn: (r) => r._measurement == "%s")
                  |> filter(fn: (r) => r.component_id == "%s")
                  |> filter(fn: (r) => r._field == "value")
                  |> sort(columns: ["_time"], desc: false)
                  |> yield(name: "raw")
                """, bucket, startStr, endStr, measurement, component.getComponentId());

        try {
            QueryApi queryApi = influxDBClient.getQueryApi();
            List<FluxTable> tables = queryApi.query(flux, org);

            List<double[]> events = new ArrayList<>();
            for (FluxTable table : tables) {
                for (FluxRecord record : table.getRecords()) {
                    if (record.getValue() == null || record.getTime() == null) continue;
                    String raw   = record.getValue().toString().toUpperCase();
                    double epoch = record.getTime().getEpochSecond();
                    events.add(new double[]{ epoch, resolveWatts(raw, component) });
                }
            }
            return events;
        } catch (Exception e) {
            log.error("Failed to query events for component={}", component.getComponentId(), e);
            return Collections.emptyList();
        }
    }

    /**
     * Returns the instantaneous power in kW for this event.
     * - ACTUATOR: nominalWatts/1000 when ON/OPEN/1/TRUE, 0 otherwise.
     * - POWER sensor: actual reading / 1000 (uses real measured value).
     * - Other sensors: nominalWatts/1000 (assumed always drawing nominal power).
     */
    private double resolveWatts(String raw, DeviceComponent component) {
        double nominalKw = component.getNominalWatts() != null
                ? component.getNominalWatts().doubleValue() / 1000.0
                : 0.0;
        if ("ACTUATOR".equals(component.getComponentType())) {
            boolean on = raw.equals("ON") || raw.equals("OPEN") || raw.equals("1") || raw.equals("TRUE");
            return on ? nominalKw : 0.0;
        }
        if ("POWER".equals(component.getSensorType())) {
            try {
                double w = Double.parseDouble(raw);
                return w > 0 ? w / 1000.0 : 0.0;
            } catch (NumberFormatException e) {
                return 0.0;
            }
        }
        return nominalKw;
    }

    // ─── Utility ──────────────────────────────────────────────────────────────

    private double round(double value, int scale) {
        return BigDecimal.valueOf(value).setScale(scale, RoundingMode.HALF_UP).doubleValue();
    }

    private double parseDurationToHours(String interval) {
        if (interval == null) throw new IllegalArgumentException("interval must not be null");
        try {
            if (interval.endsWith("m")) return Double.parseDouble(interval.replace("m", "")) / 60.0;
            if (interval.endsWith("h")) return Double.parseDouble(interval.replace("h", ""));
            if (interval.endsWith("d")) return Double.parseDouble(interval.replace("d", "")) * 24.0;
        } catch (NumberFormatException ignored) {}
        throw new IllegalArgumentException("Invalid interval format '" + interval + "'. Expected e.g. 30m, 1h, 6h, 1d.");
    }
}
