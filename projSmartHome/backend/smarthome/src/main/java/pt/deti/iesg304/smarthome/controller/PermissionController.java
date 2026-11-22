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
import org.springframework.web.bind.annotation.*;
import pt.deti.iesg304.smarthome.config.JwtUtils;
import pt.deti.iesg304.smarthome.dto.PermissionRequest;
import pt.deti.iesg304.smarthome.dto.PermissionResponse;
import pt.deti.iesg304.smarthome.service.PermissionService;

import java.util.List;

@RestController
@RequestMapping("/api/permissions")
@Tag(name = "Permissions", description = "Permission management API")
public class PermissionController {

    private final PermissionService permissionService;

    /**
     * Permission Controller constructor.
     * @param permissionService Service for Permission operations.
     */
    public PermissionController(PermissionService permissionService) {
        this.permissionService = permissionService;
    }

    /**
     * GET /api/permissions
     * Lists all permissions registered in the system.
     * @return List of PermissionResponse with HTTP 200.
     */
    @Operation(summary = "List all permissions", description = "Returns all permissions registered in the system.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Permissions listed successfully")
    })
    @GetMapping
    public ResponseEntity<List<PermissionResponse>> getAllPermissions() {
        return ResponseEntity.ok(permissionService.getAllPermissions());
    }

    /**
     * GET /api/permissions/profile/{profileId}
     * Returns all permissions granted to the given profile.
     * @param profileId - Id of the profile.
     * @return List of PermissionResponse with HTTP 200.
     */
    @Operation(summary = "Get permissions by profile", description = "Returns all permissions granted to the given profile.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Permissions listed successfully")
    })
    @GetMapping("/profile/{profileId}")
    public ResponseEntity<List<PermissionResponse>> getPermissionsByProfile(
            @Parameter(description = "ID of the profile") @PathVariable Long profileId) {
        return ResponseEntity.ok(permissionService.getPermissionsByProfile(profileId));
    }

    /**
     * GET /api/permissions/device/{deviceId}
     * Returns all permissions on the given device.
     * @param deviceId - Id of the device.
     * @return List of PermissionResponse with HTTP 200.
     */
    @Operation(summary = "Get permissions by device", description = "Returns all permissions on the given device.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Permissions listed successfully")
    })
    @GetMapping("/device/{deviceId}")
    public ResponseEntity<List<PermissionResponse>> getPermissionsByDevice(
            @Parameter(description = "ID of the device") @PathVariable String deviceId) {
        return ResponseEntity.ok(permissionService.getPermissionsByDevice(deviceId));
    }

    /**
     * GET /api/permissions/room/{roomId}
     * Returns all permissions on the given room.
     * @param roomId - Id of the room.
     * @return List of PermissionResponse with HTTP 200.
     */
    @Operation(summary = "Get permissions by room", description = "Returns all permissions on the given room.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Permissions listed successfully")
    })
    @GetMapping("/room/{roomId}")
    public ResponseEntity<List<PermissionResponse>> getPermissionsByRoom(
            @Parameter(description = "ID of the room") @PathVariable Long roomId) {
        return ResponseEntity.ok(permissionService.getPermissionsByRoom(roomId));
    }

    /**
     * GET /api/permissions/{permissionId}
     * Returns details of a specific permission.
     * @param permissionId - Id of the permission.
     * @return PermissionResponse with HTTP 200, or 404 if not found.
     */
    @Operation(summary = "Get a permission by ID", description = "Returns details of a specific permission.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Permission found successfully"),
            @ApiResponse(responseCode = "404", description = "Permission not found", content = @Content)
    })
    @GetMapping("/{permissionId}")
    public ResponseEntity<PermissionResponse> getPermissionById(
            @Parameter(description = "ID of the permission") @PathVariable Long permissionId) {
        return ResponseEntity.ok(permissionService.getPermissionById(permissionId));
    }

    /**
     * GET /api/permissions/level/{permissionLevel}
     * Returns all permissions with the given permission level.
     * @param permissionLevel - Permission level to filter by.
     * @return List of PermissionResponse with HTTP 200.
     */
    @Operation(summary = "Get permissions by level", description = "Returns all permissions with the given permission level.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Permissions listed successfully")
    })
    @GetMapping("/level/{permissionLevel}")
    public ResponseEntity<List<PermissionResponse>> getPermissionsByLevel(
            @Parameter(description = "Permission level to filter by") @PathVariable Integer permissionLevel) {
        return ResponseEntity.ok(permissionService.getPermissionsByLevel(permissionLevel));
    }

    /**
     * POST /api/permissions
     * Registers a new permission (must target a device OR a room).
     * @param request - PermissionRequest containing the permission data.
     * @return PermissionResponse with HTTP 201, or 400 if validation fails.
     */
    @Operation(summary = "Create a new permission", description = "Registers a new permission.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Permission created successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = PermissionResponse.class))),
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
    public ResponseEntity<PermissionResponse> createPermission(@RequestBody PermissionRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        PermissionResponse created = permissionService.createPermission(request, JwtUtils.extractEmail(jwt));
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * PUT /api/permissions/{permissionId}
     * Updates the permission level of an existing permission.
     * @param permissionId - Id of the permission.
     * @param request - PermissionRequest containing the updated data.
     * @return PermissionResponse with HTTP 200, or 400/404 if invalid or not found.
     */
    @Operation(summary = "Update a permission", description = "Updates the data of an existing permission.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Permission updated successfully"),
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
            @ApiResponse(responseCode = "404", description = "Permission not found", content = @Content)
    })
    @PutMapping("/{permissionId}")
    public ResponseEntity<PermissionResponse> updatePermission(
            @Parameter(description = "ID of the permission") @PathVariable Long permissionId,
            @RequestBody PermissionRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(permissionService.updatePermission(permissionId, request, JwtUtils.extractEmail(jwt)));
    }

    /**
     * DELETE /api/permissions/{permissionId}
     * Removes a permission from the system.
     * @param permissionId - Id of the permission.
     * @return HTTP 204 if deleted, or 404 if not found.
     */
    @Operation(summary = "Delete a permission", description = "Removes a permission from the system.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Permission deleted successfully", content = @Content),
            @ApiResponse(responseCode = "404", description = "Permission not found", content = @Content)
    })
    @DeleteMapping("/{permissionId}")
    public ResponseEntity<Void> deletePermission(
            @Parameter(description = "ID of the permission") @PathVariable Long permissionId,
            @AuthenticationPrincipal Jwt jwt) {
        permissionService.deletePermission(permissionId, JwtUtils.extractEmail(jwt));
        return ResponseEntity.noContent().build();
    }
}
