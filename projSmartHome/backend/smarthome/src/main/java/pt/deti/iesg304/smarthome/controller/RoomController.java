package pt.deti.iesg304.smarthome.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pt.deti.iesg304.smarthome.dto.RoomRequest;
import pt.deti.iesg304.smarthome.dto.RoomResponse;
import pt.deti.iesg304.smarthome.service.RoomService;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@Tag(name = "Rooms", description = "Room management API")
public class RoomController {

    private final RoomService roomService;

    /**
     * Room Controller constructor.
     * @param roomService Service for Room operations.
     */
    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    /**
     * GET /api/rooms/house/{houseId}
     * Lists all rooms belonging to the given house.
     * @param houseId - Id of the house.
     * @return List of RoomResponse with HTTP 200, or 404 if not found.
     */
    @Operation(summary = "List rooms in a house", description = "Returns all rooms belonging to the given house.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Rooms listed successfully"),
            @ApiResponse(responseCode = "404", description = "House not found", content = @Content(schema = @Schema(hidden = true)))
    })
    @GetMapping("/house/{houseId}")
    public ResponseEntity<List<RoomResponse>> getRoomsByHouse(
            @Parameter(description = "ID of the house") @PathVariable Long houseId) {
        return ResponseEntity.ok(roomService.getRoomsByHouse(houseId));
    }

    /**
     * GET /api/rooms/{roomId}
     * Returns details of a specific room.
     * @param roomId - Id of the room.
     * @return RoomResponse with HTTP 200, or 404 if not found.
     */
    @Operation(summary = "Get a room by ID", description = "Returns details of a specific room.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Room found successfully"),
            @ApiResponse(responseCode = "404", description = "Room not found", content = @Content(schema = @Schema(hidden = true)))
    })
    @GetMapping("/{roomId}")
    public ResponseEntity<RoomResponse> getRoomById(
            @Parameter(description = "ID of the room") @PathVariable Long roomId) {
        return ResponseEntity.ok(roomService.getRoomById(roomId));
    }

    /**
     * POST /api/rooms
     * Creates a new room and associates it with a house.
     * @param request - RoomRequest containing the room data.
     * @return RoomResponse with HTTP 201, or 400 if validation fails.
     */
    @Operation(summary = "Create a new room", description = "Creates a room and associates it with a house.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Room created successfully"),
            @ApiResponse(responseCode = "400", description = "Validation error",
                    content = @Content(mediaType = "application/json",
                            examples = @ExampleObject(value = "{\n  \"timestamp\": \"2024-05-10T12:00:00.000+00:00\",\n  \"status\": 400,\n  \"error\": \"Bad Request\",\n  \"message\": \"Validation error message...\",\n  \"path\": \"/api/rooms\"\n}")))
    })
    @PostMapping
    public ResponseEntity<RoomResponse> createRoom(@RequestBody RoomRequest request) {
        RoomResponse created = roomService.createRoom(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * PUT /api/rooms/{roomId}
     * Updates the metadata of an existing room.
     * @param roomId - Id of the room.
     * @param request - RoomRequest containing the updated data.
     * @return RoomResponse with HTTP 200, or 400/404 if invalid or not found.
     */
    @Operation(summary = "Update a room", description = "Updates the metadata of an existing room.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Room updated successfully"),
            @ApiResponse(responseCode = "400", description = "Validation error",
                    content = @Content(mediaType = "application/json",
                            examples = @ExampleObject(value = "{\n  \"timestamp\": \"2024-05-10T12:00:00.000+00:00\",\n  \"status\": 400,\n  \"error\": \"Bad Request\",\n  \"message\": \"Validation error message...\",\n  \"path\": \"/api/rooms/{roomId}\"\n}"))),
            @ApiResponse(responseCode = "404", description = "Room not found", content = @Content(schema = @Schema(hidden = true)))
    })
    @PutMapping("/{roomId}")
    public ResponseEntity<RoomResponse> updateRoom(
            @Parameter(description = "ID of the room") @PathVariable Long roomId,
            @RequestBody RoomRequest request) {
        return ResponseEntity.ok(roomService.updateRoom(roomId, request));
    }

    /**
     * DELETE /api/rooms/{roomId}
     * Removes a room and all its associated devices.
     * @param roomId - Id of the room.
     * @return HTTP 204 if deleted, or 404 if not found.
     */
    @Operation(summary = "Delete a room", description = "Removes a room and all its associated devices.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Room deleted successfully", content = @Content),
            @ApiResponse(responseCode = "404", description = "Room not found", content = @Content(schema = @Schema(hidden = true)))
    })
    @DeleteMapping("/{roomId}")
    public ResponseEntity<Void> deleteRoom(
            @Parameter(description = "ID of the room") @PathVariable Long roomId) {
        roomService.deleteRoom(roomId);
        return ResponseEntity.noContent().build();
    }
}
