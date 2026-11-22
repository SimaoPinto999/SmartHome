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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import pt.deti.iesg304.smarthome.config.JwtUtils;
import pt.deti.iesg304.smarthome.dto.DeviceRequest;
import pt.deti.iesg304.smarthome.dto.DeviceResponse;
import pt.deti.iesg304.smarthome.service.DeviceService;

import java.util.List;

@RestController
@RequestMapping("/api/devices")
@Tag(name = "Devices", description = "Device management API")
public class DeviceController {

    private final DeviceService deviceService;

    /**
     * Device Controller constructor.
     * @param deviceService Service for Device operations.
     */
    public DeviceController(DeviceService deviceService) {
        this.deviceService = deviceService;
    }

    /**
     * GET /api/devices
     * Returns a list of all devices belonging to the authenticated user's house.
     * @return List of DeviceResponse with HTTP 200.
     */
    @Operation(summary = "Get all devices", description = "Returns a list of all devices in the smart home.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Devices returned successfully")
    })
    @GetMapping
    public ResponseEntity<List<DeviceResponse>> getDevices(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(deviceService.getAllDevices(JwtUtils.extractEmail(jwt)));
    }

    /**
     * GET /api/devices/room/{roomId}
     * Returns all devices belonging to the given room, scoped to the authenticated user's house.
     * @param roomId - Id of the room.
     * @return List of DeviceResponse with HTTP 200, or 404 if not found.
     */
    @Operation(summary = "Get devices by room", description = "Returns all devices belonging to the given room.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Room devices returned successfully"),
            @ApiResponse(responseCode = "404", description = "Room not found", content = @Content)
    })
    @GetMapping("/room/{roomId}")
    public ResponseEntity<List<DeviceResponse>> getDevicesByRoom(
            @Parameter(description = "ID of the room") @PathVariable Long roomId,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(deviceService.getDevicesByRoom(roomId, JwtUtils.extractEmail(jwt)));
    }

    /**
     * GET /api/devices/{deviceId}
     * Returns details of a specific device, only if it belongs to the authenticated user's house.
     * @param deviceId - Id of the device.
     * @return DeviceResponse with HTTP 200, or 404 if not found.
     */
    @Operation(summary = "Get a device by ID", description = "Returns details of a specific device.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Device returned successfully"),
            @ApiResponse(responseCode = "404", description = "Device not found", content = @Content)
    })
    @GetMapping("/{deviceId}")
    public ResponseEntity<DeviceResponse> getDeviceById(
            @Parameter(description = "ID of the device") @PathVariable String deviceId,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(deviceService.getDeviceById(deviceId, JwtUtils.extractEmail(jwt)));
    }

    /**
     * GET /api/devices/status/{status}
     * Returns all devices with the given status (e.g. ONLINE, OFFLINE), scoped to the authenticated user's house.
     * @param status - Status value to filter by.
     * @return List of DeviceResponse with HTTP 200.
     */
    @Operation(summary = "Get devices by status", description = "Returns all devices with the given status (e.g. ONLINE, OFFLINE).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Devices returned successfully")
    })
    @GetMapping("/status/{status}")
    public ResponseEntity<List<DeviceResponse>> getDevicesByStatus(
            @Parameter(description = "Status of the device") @PathVariable String status,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(deviceService.getDevicesByStatus(status, JwtUtils.extractEmail(jwt)));
    }

    /**
     * POST /api/devices/{deviceId}
     * Registers a new device with the given ID. Initial status is OFFLINE.
     * @param deviceId - Id to assign to the new device.
     * @param request - DeviceRequest containing the device data.
     * @return DeviceResponse with HTTP 201, or 400 if validation fails.
     */
    @Operation(summary = "Register a new device", description = "Creates a new device with the given ID. Initial status is OFFLINE.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Device created successfully",
                         content = @Content(mediaType = "application/json", schema = @Schema(implementation = DeviceResponse.class))),
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
    @PostMapping("/{deviceId}")
    public ResponseEntity<DeviceResponse> createDevice(
            @Parameter(description = "ID of the device") @PathVariable String deviceId,
            @Valid @RequestBody DeviceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(deviceService.createDevice(deviceId, request));
    }

    /**
     * PUT /api/devices/{deviceId}
     * Updates the metadata of an existing device.
     * @param deviceId - Id of the device.
     * @param request - DeviceRequest containing the updated data.
     * @return DeviceResponse with HTTP 200, or 400/404 if invalid or not found.
     */
    @Operation(summary = "Update a device", description = "Updates the metadata of an existing device.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Device updated successfully"),
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
            @ApiResponse(responseCode = "404", description = "Device not found", content = @Content)
    })
    @PutMapping("/{deviceId}")
    public ResponseEntity<DeviceResponse> updateDevice(
            @Parameter(description = "ID of the device") @PathVariable String deviceId,
            @Valid @RequestBody DeviceRequest request) {
        return ResponseEntity.ok(deviceService.updateDevice(deviceId, request));
    }

    /**
     * DELETE /api/devices/{deviceId}
     * Removes a device and all its associated components and logs.
     * @param deviceId - Id of the device.
     * @return HTTP 204 if deleted, or 404 if not found.
     */
    @Operation(summary = "Delete a device", description = "Removes a device and all its associated components and logs.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Device deleted successfully", content = @Content),
            @ApiResponse(responseCode = "404", description = "Device not found", content = @Content)
    })
    @DeleteMapping("/{deviceId}")
    public ResponseEntity<Void> deleteDevice(
            @Parameter(description = "ID of the device") @PathVariable String deviceId) {
        deviceService.deleteDevice(deviceId);
        return ResponseEntity.noContent().build();
    }
}
