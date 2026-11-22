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
import pt.deti.iesg304.smarthome.dto.HouseRequest;
import pt.deti.iesg304.smarthome.dto.HouseResponse;
import pt.deti.iesg304.smarthome.service.HouseService;

import java.util.List;

@RestController
@RequestMapping("/api/houses")
@Tag(name = "Houses", description = "House management API")
public class HouseController {

    private final HouseService houseService;

    /**
     * House Controller constructor.
     * @param houseService Service for House operations.
     */
    public HouseController(HouseService houseService) {
        this.houseService = houseService;
    }

    /**
     * GET /api/houses
     * Lists all houses registered in the system.
     * @return List of HouseResponse with HTTP 200.
     */
    @Operation(summary = "List all houses", description = "Returns all houses registered in the system.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Houses listed successfully")
    })
    @GetMapping
    public ResponseEntity<List<HouseResponse>> getAllHouses() {
        return ResponseEntity.ok(houseService.getAllHouses());
    }

    /**
     * GET /api/houses/account/{accountId}
     * Returns all houses belonging to the given account.
     * @param accountId - Id of the account.
     * @return List of HouseResponse with HTTP 200, or 404 if not found.
     */
    @Operation(summary = "Get houses by account", description = "Returns all houses belonging to the given account.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Houses listed successfully"),
            @ApiResponse(responseCode = "404", description = "Account not found", content = @Content)
    })
    @GetMapping("/account/{accountId}")
    public ResponseEntity<List<HouseResponse>> getHousesByAccount(
            @Parameter(description = "ID of the account") @PathVariable Long accountId) {
        return ResponseEntity.ok(houseService.getHousesByAccount(accountId));
    }

    /**
     * GET /api/houses/{houseId}
     * Returns details of a specific house.
     * @param houseId - Id of the house.
     * @return HouseResponse with HTTP 200, or 404 if not found.
     */
    @Operation(summary = "Get a house by ID", description = "Returns details of a specific house.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "House found successfully"),
            @ApiResponse(responseCode = "404", description = "House not found", content = @Content(schema = @Schema(hidden = true)))
    })
    @GetMapping("/{houseId}")
    public ResponseEntity<HouseResponse> getHouseById(
            @Parameter(description = "ID of the house") @PathVariable Long houseId) {
        return ResponseEntity.ok(houseService.getHouseById(houseId));
    }

    /**
     * POST /api/houses
     * Registers a new house.
     * @param request - HouseRequest containing the house data.
     * @return HouseResponse with HTTP 201, or 400 if validation fails.
     */
    @Operation(summary = "Create a new house", description = "Registers a new house.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "House created successfully"),
            @ApiResponse(responseCode = "400", description = "Validation error",
                    content = @Content(mediaType = "application/json",
                            examples = @ExampleObject(value = "{\n  \"timestamp\": \"2024-05-10T12:00:00.000+00:00\",\n  \"status\": 400,\n  \"error\": \"Bad Request\",\n  \"message\": \"Validation error message...\",\n  \"path\": \"/api/houses\"\n}")))
    })
    @PostMapping
    public ResponseEntity<HouseResponse> createHouse(@RequestBody HouseRequest request) {
        HouseResponse created = houseService.createHouse(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * PUT /api/houses/{houseId}
     * Updates the data of an existing house.
     * @param houseId - Id of the house.
     * @param request - HouseRequest containing the updated data.
     * @return HouseResponse with HTTP 200, or 400/404 if invalid or not found.
     */
    @Operation(summary = "Update a house", description = "Updates the data of an existing house.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "House updated successfully"),
            @ApiResponse(responseCode = "400", description = "Validation error",
                    content = @Content(mediaType = "application/json",
                            examples = @ExampleObject(value = "{\n  \"timestamp\": \"2024-05-10T12:00:00.000+00:00\",\n  \"status\": 400,\n  \"error\": \"Bad Request\",\n  \"message\": \"Validation error message...\",\n  \"path\": \"/api/houses/{houseId}\"\n}"))),
            @ApiResponse(responseCode = "404", description = "House not found", content = @Content(schema = @Schema(hidden = true)))
    })
    @PutMapping("/{houseId}")
    public ResponseEntity<HouseResponse> updateHouse(
            @Parameter(description = "ID of the house") @PathVariable Long houseId,
            @RequestBody HouseRequest request) {
        return ResponseEntity.ok(houseService.updateHouse(houseId, request));
    }

    /**
     * DELETE /api/houses/{houseId}
     * Removes a house from the system.
     * @param houseId - Id of the house.
     * @return HTTP 204 if deleted, or 404 if not found.
     */
    @Operation(summary = "Delete a house", description = "Removes a house from the system.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "House deleted successfully", content = @Content),
            @ApiResponse(responseCode = "404", description = "House not found", content = @Content(schema = @Schema(hidden = true)))
    })
    @DeleteMapping("/{houseId}")
    public ResponseEntity<Void> deleteHouse(
            @Parameter(description = "ID of the house") @PathVariable Long houseId) {
        houseService.deleteHouse(houseId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Set alarm state", description = "Arms or disarms the security alarm for a house.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Alarm state updated"),
            @ApiResponse(responseCode = "404", description = "House not found", content = @Content(schema = @Schema(hidden = true)))
    })
    @PatchMapping("/{houseId}/alarm")
    public ResponseEntity<HouseResponse> setAlarm(
            @Parameter(description = "ID of the house") @PathVariable Long houseId,
            @RequestParam boolean armed,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(houseService.setAlarmArmed(houseId, armed, JwtUtils.extractEmail(jwt)));
    }
}
