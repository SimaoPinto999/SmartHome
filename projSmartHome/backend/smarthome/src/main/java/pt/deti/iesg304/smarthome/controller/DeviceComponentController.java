package pt.deti.iesg304.smarthome.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pt.deti.iesg304.smarthome.dto.DeviceComponentRequest;
import pt.deti.iesg304.smarthome.dto.DeviceComponentResponse;
import pt.deti.iesg304.smarthome.service.DeviceComponentService;

import java.util.List;

@RestController
@RequestMapping("/api/device-components")
@Tag(name = "Device Components", description = "Device Components management API")
public class DeviceComponentController {

    private final DeviceComponentService deviceComponentService;

    /**
     * Device Component Controller constructor.
     * @param deviceComponentService Service for DeviceComponent operations.
     */
    public DeviceComponentController(DeviceComponentService deviceComponentService) {
        this.deviceComponentService = deviceComponentService;
    }

    /**
     * GET /api/device-components/house/{houseId}
     * Lists all components belonging to the given house.
     */
    @Operation(summary = "List components of a house", description = "Returns all components belonging to all devices in the house.")
    @ApiResponses(@ApiResponse(responseCode = "200", description = "Components listed successfully"))
    @GetMapping("/house/{houseId}")
    public ResponseEntity<List<DeviceComponentResponse>> getComponentsByHouse(
            @Parameter(description = "ID of the house") @PathVariable Long houseId) {
        return ResponseEntity.ok(deviceComponentService.getComponentsByHouse(houseId));
    }

    /**
     * GET /api/device-components/device/{deviceId}
     * Lists all components belonging to the given device.
     * @param deviceId - Id of the device.
     * @return List of DeviceComponentResponse with HTTP 200.
     */
    @Operation(summary = "List components of a device", description = "Returns all components belonging to the given device.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Components listed successfully"),
            @ApiResponse(responseCode = "404", description = "Resource not found", content = @Content)
    })
    @GetMapping("/device/{deviceId}")
    public ResponseEntity<List<DeviceComponentResponse>> getComponentsByDevice(
            @Parameter(description = "ID of the device") @PathVariable String deviceId) {
        return ResponseEntity.ok(deviceComponentService.getComponentsByDevice(deviceId));
    }

    /**
     * GET /api/device-components/all
     * Lists all device components in the system.
     * @return List of DeviceComponentResponse with HTTP 200.
     */
    @Operation(summary = "List all device components", description = "Returns all device components in the system.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Components listed successfully")
    })
    @GetMapping("/all")
    public ResponseEntity<List<DeviceComponentResponse>> getAllComponents() {
        return ResponseEntity.ok(deviceComponentService.getAllComponents());
    }

    /**
     * GET /api/device-components/{componentId}
     * Returns details of a specific device component.
     * @param componentId - Id of the component.
     * @return DeviceComponentResponse with HTTP 200, or 404 if not found.
     */
    @Operation(summary = "Get a device component by ID", description = "Returns details of a specific device component.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Component returned successfully"),
            @ApiResponse(responseCode = "404", description = "Component not found", content = @Content)
    })
    @GetMapping("/{componentId}")
    public ResponseEntity<DeviceComponentResponse> getComponentById(
            @Parameter(description = "ID of the component") @PathVariable Long componentId) {
        return ResponseEntity.ok(deviceComponentService.getComponentById(componentId));
    }

    /**
     * GET /api/device-components/topic/{mqttTopic}
     * Returns the device component bound to the given MQTT topic.
     * @param mqttTopic - MQTT topic of the component.
     * @return DeviceComponentResponse with HTTP 200, or 404 if not found.
     */
    @Operation(summary = "Get a device component by MQTT topic", description = "Returns the device component bound to the given MQTT topic.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Component found successfully"),
            @ApiResponse(responseCode = "404", description = "Component not found", content = @Content)
    })
    @GetMapping("/topic/{mqttTopic}")
    public ResponseEntity<DeviceComponentResponse> getComponentByMqttTopic(
            @Parameter(description = "MQTT topic of the component") @PathVariable String mqttTopic) {
        return ResponseEntity.ok(deviceComponentService.getComponentByMqttTopic(mqttTopic));
    }

    /**
     * POST /api/device-components
     * Creates a new device component and associates it with a device.
     * @param request - DeviceComponentRequest containing the component data.
     * @return DeviceComponentResponse with HTTP 201, or 400 if validation fails.
     */
    @Operation(summary = "Create a new device component", description = "Creates a device component and associates it with a device.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Component created successfully",
                         content = @Content(mediaType = "application/json", schema = @Schema(implementation = DeviceComponentResponse.class))),
            @ApiResponse(responseCode = "400", description = "Bad Request (e.g. Invalid data)",
                    content = @Content(mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = "{\n" +
                                            "  \"error\": \"Bad Request\",\n" +
                                            "  \"message\": \"Validation error...\",\n" +
                                            "  \"timestamp\": \"2026-04-22T10:00:00.000Z\",\n" +
                                            "  \"status\": 400\n" +
                                            "}"
                            )))
    })
    @PostMapping
    public ResponseEntity<DeviceComponentResponse> createComponent(@RequestBody DeviceComponentRequest request) {
        DeviceComponentResponse created = deviceComponentService.createComponent(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * PUT /api/device-components/{componentId}
     * Updates the metadata of an existing device component.
     * @param componentId - Id of the component.
     * @param request - DeviceComponentRequest containing the updated data.
     * @return DeviceComponentResponse with HTTP 200, or 400/404 if invalid or not found.
     */
    @Operation(summary = "Update a device component", description = "Updates the metadata of an existing device component.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Component updated successfully"),
            @ApiResponse(responseCode = "400", description = "Bad Request (e.g. Invalid data)",
                    content = @Content(mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = "{\n" +
                                            "  \"error\": \"Bad Request\",\n" +
                                            "  \"message\": \"Validation error...\",\n" +
                                            "  \"timestamp\": \"2026-04-22T10:00:00.000Z\",\n" +
                                            "  \"status\": 400\n" +
                                            "}"
                            ))),
            @ApiResponse(responseCode = "404", description = "Component not found", content = @Content)
    })
    @PutMapping("/{componentId}")
    public ResponseEntity<DeviceComponentResponse> updateComponent(
            @Parameter(description = "ID of the component") @PathVariable Long componentId,
            @RequestBody DeviceComponentRequest request) {
        return ResponseEntity.ok(deviceComponentService.updateComponent(componentId, request));
    }

    /**
     * DELETE /api/device-components/{componentId}
     * Removes a device component.
     * @param componentId - Id of the component.
     * @return HTTP 204 if deleted, or 404 if not found.
     */
    @Operation(summary = "Delete a device component", description = "Removes a device component.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Component deleted successfully", content = @Content),
            @ApiResponse(responseCode = "404", description = "Component not found", content = @Content)
    })
    @DeleteMapping("/{componentId}")
    public ResponseEntity<Void> deleteComponent(
            @Parameter(description = "ID of the component") @PathVariable Long componentId) {
        deviceComponentService.deleteComponent(componentId);
        return ResponseEntity.noContent().build();
    }
}
