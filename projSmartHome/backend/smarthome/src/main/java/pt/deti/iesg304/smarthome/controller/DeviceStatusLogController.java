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
import pt.deti.iesg304.smarthome.dto.DeviceStatusLogRequest;
import pt.deti.iesg304.smarthome.dto.DeviceStatusLogResponse;
import pt.deti.iesg304.smarthome.service.DeviceStatusLogService;

import java.util.List;

@RestController
@RequestMapping("/api/status-logs")
@Tag(name = "Device Status Logs", description = "Device Status Log management API")
public class DeviceStatusLogController {

    private final DeviceStatusLogService statusLogService;

    /**
     * Device Status Log Controller constructor.
     * @param statusLogService Service for DeviceStatusLog operations.
     */
    public DeviceStatusLogController(DeviceStatusLogService statusLogService) {
        this.statusLogService = statusLogService;
    }

    /**
     * GET /api/status-logs/device/{deviceId}
     * Lists all status logs belonging to the given device.
     * @param deviceId - Id of the device.
     * @return List of DeviceStatusLogResponse with HTTP 200.
     */
    @Operation(summary = "List status logs of a device", description = "Returns all status logs belonging to the given device.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Logs listed successfully"),
            @ApiResponse(responseCode = "404", description = "Device not found", content = @Content)
    })
    @GetMapping("/device/{deviceId}")
    public ResponseEntity<List<DeviceStatusLogResponse>> getLogsByDevice(
            @Parameter(description = "ID of the device") @PathVariable String deviceId) {
        return ResponseEntity.ok(statusLogService.getLogsByDevice(deviceId));
    }

    /**
     * GET /api/status-logs/{logId}
     * Returns details of a specific status log.
     * @param logId - Id of the status log.
     * @return DeviceStatusLogResponse with HTTP 200, or 404 if not found.
     */
    @Operation(summary = "Get a status log by ID", description = "Returns details of a specific status log.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Log returned successfully"),
            @ApiResponse(responseCode = "404", description = "Log not found", content = @Content)
    })
    @GetMapping("/{logId}")
    public ResponseEntity<DeviceStatusLogResponse> getLogById(
            @Parameter(description = "ID of the status log") @PathVariable Long logId) {
        return ResponseEntity.ok(statusLogService.getLogById(logId));
    }

    /**
     * GET /api/status-logs/status/{statusValue}
     * Returns all status logs with the given status value (e.g. ONLINE, OFFLINE).
     * @param statusValue - Status value to filter by.
     * @return List of DeviceStatusLogResponse with HTTP 200.
     */
    @Operation(summary = "Get status logs by status value", description = "Returns all status logs with the given status value (e.g. ONLINE, OFFLINE).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Status logs returned successfully")
    })
    @GetMapping("/status/{statusValue}")
    public ResponseEntity<List<DeviceStatusLogResponse>> getLogsByStatus(
            @Parameter(description = "Status value to filter by") @PathVariable String statusValue) {
        return ResponseEntity.ok(statusLogService.getLogsByStatus(statusValue));
    }

    /**
     * POST /api/status-logs
     * Creates a new status log for a device. Timestamp is set server-side.
     * @param request - DeviceStatusLogRequest containing the log data.
     * @return DeviceStatusLogResponse with HTTP 201, or 400 if validation fails.
     */
    @Operation(summary = "Create a new status log", description = "Creates a new status log for a device.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Log created successfully",
                         content = @Content(mediaType = "application/json", schema = @Schema(implementation = DeviceStatusLogResponse.class))),
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
    public ResponseEntity<DeviceStatusLogResponse> createLog(@RequestBody DeviceStatusLogRequest request) {
        DeviceStatusLogResponse created = statusLogService.createLog(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * DELETE /api/status-logs/{logId}
     * Removes a status log by ID.
     * @param logId - Id of the status log.
     * @return HTTP 204 if deleted, or 404 if not found.
     */
    @Operation(summary = "Delete a status log", description = "Removes a status log by ID.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Log deleted successfully", content = @Content),
            @ApiResponse(responseCode = "404", description = "Log not found", content = @Content)
    })
    @DeleteMapping("/{logId}")
    public ResponseEntity<Void> deleteLog(
            @Parameter(description = "ID of the status log") @PathVariable Long logId) {
        statusLogService.deleteLog(logId);
        return ResponseEntity.noContent().build();
    }
}
