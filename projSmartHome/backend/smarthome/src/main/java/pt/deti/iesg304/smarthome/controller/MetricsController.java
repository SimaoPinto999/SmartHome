package pt.deti.iesg304.smarthome.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.media.Content;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pt.deti.iesg304.smarthome.config.MqttPublisherConfig.MqttGateway;
import pt.deti.iesg304.smarthome.dto.MetricHistoryResponse;
import pt.deti.iesg304.smarthome.dto.MetricLatestResponse;
import pt.deti.iesg304.smarthome.model.DeviceComponent;
import pt.deti.iesg304.smarthome.repository.DeviceComponentRepository;
import pt.deti.iesg304.smarthome.service.InfluxDBService;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/metrics")
@Tag(name = "Metrics", description = "InfluxDB metrics and actuator command API")

public class MetricsController {

    private final InfluxDBService influxDBService;
    private final DeviceComponentRepository deviceComponentRepository;
    private final MqttGateway mqttGateway;

    public MetricsController(InfluxDBService influxDBService, DeviceComponentRepository deviceComponentRepository, MqttGateway mqttGateway) {

        this.influxDBService = influxDBService;
        this.deviceComponentRepository = deviceComponentRepository;
        this.mqttGateway = mqttGateway;

    }

    // -----------------------------------------------------------------------
    // GET /api/metrics/{componentId}/latest
    // Listar as últimas métricas de um dado componente
    // -----------------------------------------------------------------------

    @Operation(
        summary = "Get latest metric value",
        description = "Returns the most recent value stored in InfluxDB for the given component."
    )

    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Value returned successfully"),
        @ApiResponse(responseCode = "404", description = "Component not found or no data available", content = @Content)
    })

    @GetMapping("/{componentId}/latest")
    public ResponseEntity<MetricLatestResponse> getLatest( @Parameter(description = "ID of the device component") @PathVariable String componentId ) {

        MetricLatestResponse response = influxDBService.getLatest(componentId);

        if (response == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(response);
    }

    // -----------------------------------------------------------------------
    // GET /api/metrics/{componentId}/history 
    // Listar o histórico de métricas de um determinado componente
    // -----------------------------------------------------------------------

    @Operation(
        summary = "Get metric history",
        description = "Returns aggregated historical data for a component. " + "Use 'range' (e.g. 15m, 1h, 6h, 24h) and 'interval' (e.g. 30s, 1m, 5m, 15m)."
    )

    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "History returned successfully"),
        @ApiResponse(responseCode = "404", description = "Component not found", content = @Content)
    })

    @GetMapping("/{componentId}/history")
    public ResponseEntity<MetricHistoryResponse> getHistory(
            @Parameter(description = "ID of the device component") @PathVariable Long componentId,
            @Parameter(description = "Time range (e.g. 15m, 1h, 6h, 24h)") @RequestParam(defaultValue = "1h") String range,
            @Parameter(description = "Aggregation interval (e.g. 30s, 1m, 5m, 15m)") @RequestParam(defaultValue = "1m") String interval) {

        if (deviceComponentRepository.findById(componentId).isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        MetricHistoryResponse response = influxDBService.getHistory(String.valueOf(componentId), range, interval);
        return ResponseEntity.ok(response);
    }

    // -----------------------------------------------------------------------
    // PUT /api/metrics/{componentId}/command 
    // Adiciona as alterações à base de dados da InfluxDB
    // -----------------------------------------------------------------------

    @Operation(

        summary = "Send actuator command",
        description = "Publishes a command value to the MQTT topic of the given actuator component. " + "Body: { \"value\": \"ON\" } or { \"value\": \"#ff0000\" }"
    
    )

    @ApiResponses(value = {

        @ApiResponse(responseCode = "200", description = "Command published successfully"),
        @ApiResponse(responseCode = "404", description = "Component not found", content = @Content),
        @ApiResponse(responseCode = "400", description = "Component is not an actuator or invalid payload", content = @Content)

    })

    @PutMapping("/{componentId}/command")
    public ResponseEntity<Void> sendCommand( @Parameter(description = "ID of the actuator component") @PathVariable Long componentId, @RequestBody Map<String, String> body){

        String value = body.get("value");
        if (value == null || value.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        Optional<DeviceComponent> componentOpt = deviceComponentRepository.findById(componentId);
        if (componentOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        DeviceComponent component = componentOpt.get();

        if (!"ACTUATOR".equals(component.getComponentType())) {
            return ResponseEntity.badRequest().build();
        }

        // Publish to the /set MQTT topic. 
        // The backend inbound subscriber only listens to the base topic,
        // so this command won't be treated as telemetry until the device
        // processes the /set message and publishes its new state to the base topic.
        mqttGateway.publish(component.getMqttTopic() + "/set", value);

        return ResponseEntity.ok().build();
    }
}