package pt.deti.iesg304.smarthome.service;

import com.influxdb.client.InfluxDBClient;
import com.influxdb.client.QueryApi;
import com.influxdb.client.WriteApiBlocking;
import com.influxdb.client.domain.WritePrecision;
import com.influxdb.client.write.Point;
import com.influxdb.query.FluxRecord;
import com.influxdb.query.FluxTable;

import lombok.NonNull;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import pt.deti.iesg304.smarthome.dto.MetricHistoryResponse;
import pt.deti.iesg304.smarthome.dto.MetricLatestResponse;
import pt.deti.iesg304.smarthome.dto.MetricPointDto;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;


@Service
public class InfluxDBService {

    private static final Logger log = LoggerFactory.getLogger(InfluxDBService.class);

    private final InfluxDBClient influxDBClient;

    @Value("${influxdb.bucket}")
    private String bucket;

    @Value("${influxdb.org}")
    private String org;

    public InfluxDBService(InfluxDBClient influxDBClient) {
        this.influxDBClient = influxDBClient;
    }

    private static final String MEASUREMENT_SENSOR   = "sensor_reading";
    private static final String MEASUREMENT_ACTUATOR = "actuator_state";

    /**
     * Writes a sensor data point to InfluxDB.
     * Numeric values are stored as double; string values (toggle, RGB) as string.
     * @param componentId - Id of the device component.
     * @param statusValue - Sensor value (temperature, toggle state, energy, etc.).
     * @param deviceId    - Id of the device for tagging.
     * @param measurement - InfluxDB measurement name.
     * @param unit        - Unit of the value.
     */
    public void writeSensorData(String componentId, String statusValue, String deviceId,
                                @NonNull String measurement, String unit) {
        try {
            Point point = Point.measurement(measurement)
                    .addTag("component_id", componentId)
                    .addTag("device_id", deviceId)
                    .addTag("unit", unit != null ? unit : "")
                    .time(Instant.now(), WritePrecision.NS);

            // Store numeric values as double so aggregateWindow works correctly.
            // String values (ON/OFF, #rrggbb) are stored as string.
            if (isNumeric(statusValue)) {
                point.addField("value", Double.parseDouble(statusValue));
            } else {
                point.addField("str_value", statusValue);
            }

            WriteApiBlocking writeApi = influxDBClient.getWriteApiBlocking();
            writeApi.writePoint(bucket, org, point);

            log.info("Successfully wrote sensor data to InfluxDB: component={}, value={}", componentId, statusValue);
        } catch (Exception e) {
            log.error("Failed to write sensor data to InfluxDB: component={}, value={}", componentId, statusValue, e);
        }
    }

    /**
     * Returns the most recent value for a given component.
     * Checks sensor_reading first, then actuator_state.
     * Returns null if no data is found.
     */
    public MetricLatestResponse getLatest(String componentId) {
        for (String measurement : List.of(MEASUREMENT_SENSOR, MEASUREMENT_ACTUATOR)) {
            MetricLatestResponse result = queryLatest(componentId, measurement);
            if (result != null) return result;
        }
        log.warn("No data found in InfluxDB for component={}", componentId);
        return null;
    }

    private MetricLatestResponse queryLatest(String componentId, String measurement) {
        String flux = String.format("""
                from(bucket: "%s")
                  |> range(start: -30d)
                  |> filter(fn: (r) => r._measurement == "%s")
                  |> filter(fn: (r) => r.component_id == "%s")
                  |> filter(fn: (r) => r._field == "value" or r._field == "str_value")
                  |> last()
                """, bucket, measurement, componentId);

        try {
            QueryApi queryApi = influxDBClient.getQueryApi();
            List<FluxTable> tables = queryApi.query(flux, org);

            // Pick the record with the most recent timestamp across all fields.
            // last() returns one row per field (value + str_value); without this
            // comparison the older field could be returned first.
            FluxRecord latest = null;
            for (FluxTable table : tables) {
                for (FluxRecord record : table.getRecords()) {
                    if (record.getValue() == null || record.getTime() == null) continue;
                    if (latest == null || record.getTime().isAfter(latest.getTime())) {
                        latest = record;
                    }
                }
            }
            if (latest != null) {
                return new MetricLatestResponse(
                        componentId,
                        latest.getValue().toString(),
                        latest.getTime().toString()
                );
            }
        } catch (Exception e) {
            log.error("Failed to query latest for component={}, measurement={}", componentId, measurement, e);
        }
        return null;
    }

    /**
     * Returns historical data points for a component, used for charting.
     * Checks sensor_reading first, then actuator_state.
     *
     * When interval="raw", returns every raw data point without aggregation.
     * This is used for toggle/binary signals (ON/OFF) where each state change
     * must be shown individually rather than aggregated into windows.
     *
     * @param componentId component_id tag value
     * @param range       Flux range string e.g. "15m", "1h", "6h", "24h"
     * @param interval    aggregateWindow every e.g. "30s", "1m", "5m" — or "raw" to skip aggregation
     */

    public MetricHistoryResponse getHistory(String componentId, String range, String interval) {

        for (String measurement : List.of(MEASUREMENT_SENSOR, MEASUREMENT_ACTUATOR)) {
            List<MetricPointDto> points = queryHistory(componentId, measurement, range, interval);
            if (!points.isEmpty()) return new MetricHistoryResponse(componentId, points);
        }
        
        log.warn("No history found in InfluxDB for component={}", componentId);
        return new MetricHistoryResponse(componentId, new ArrayList<>());
    }

    private List<MetricPointDto> queryHistory(String componentId, String measurement,
                                              String range, String interval) {
        String flux;

        if ("raw".equals(interval)) {
            // No aggregation — return every raw data point.
            // Used for toggle/binary signals where we want each ON/OFF event.
            flux = String.format("""
                    from(bucket: "%s")
                      |> range(start: -%s)
                      |> filter(fn: (r) => r._measurement == "%s")
                      |> filter(fn: (r) => r.component_id == "%s")
                      |> filter(fn: (r) => r._field == "value" or r._field == "str_value")
                      |> sort(columns: ["_time"], desc: false)
                      |> yield(name: "history")
                    """, bucket, range, measurement, componentId);
        } else {
            // Aggregated — group data into windows of the given interval.
            // Used for numeric sensors (temperature, energy, etc.).
            flux = String.format("""
                    from(bucket: "%s")
                      |> range(start: -%s)
                      |> filter(fn: (r) => r._measurement == "%s")
                      |> filter(fn: (r) => r.component_id == "%s")
                      |> filter(fn: (r) => r._field == "value")
                      |> aggregateWindow(every: %s, fn: mean, createEmpty: false)
                      |> sort(columns: ["_time"], desc: false)
                      |> yield(name: "history")
                    """, bucket, range, measurement, componentId, interval);
        }

        List<MetricPointDto> points = new ArrayList<>();
        try {
            QueryApi queryApi = influxDBClient.getQueryApi();
            List<FluxTable> tables = queryApi.query(flux, org);

            for (FluxTable table : tables) {
                for (FluxRecord record : table.getRecords()) {
                    if (record.getValue() == null || record.getTime() == null) continue;
                    points.add(new MetricPointDto(
                            record.getTime().toString(),
                            record.getValue().toString()
                    ));
                }
            }
        } catch (Exception e) {
            log.error("Failed to query history for component={}, measurement={}", componentId, measurement, e);
        }
        return points;
    }

    /**
     * Checks if the given string value is a valid numeric (double).
     * @param value - String value to check.
     * @return true if numeric, false otherwise.
     */
    private boolean isNumeric(String value) {
        try {
            Double.parseDouble(value);
            return true;
        } catch (NumberFormatException e) {
            return false;
        }
    }
}