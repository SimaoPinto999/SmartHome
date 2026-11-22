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
import pt.deti.iesg304.smarthome.dto.PinVerificationRequest;
import pt.deti.iesg304.smarthome.dto.ProfileRequest;
import pt.deti.iesg304.smarthome.dto.ProfileResponse;
import pt.deti.iesg304.smarthome.service.ProfileService;

import java.util.List;

@RestController
@RequestMapping("/api/profiles")
@Tag(name = "Profiles", description = "Profile management API")
public class ProfileController {

    private final ProfileService profileService;

    /**
     * Profile Controller constructor.
     * @param profileService Service for Profile operations.
     */
    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    /**
     * GET /api/profiles/account/{accountId}
     * Returns all profiles belonging to a specific account.
     * @param accountId - Id of the account.
     * @return List of ProfileResponse with HTTP 200, or 404 if not found.
     */
    @Operation(summary = "List profiles for an account", description = "Returns all profiles belonging to a specific account.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Profiles listed successfully"),
            @ApiResponse(responseCode = "404", description = "Account not found", content = @Content)
    })
    @GetMapping("/account/{accountId}")
    public ResponseEntity<List<ProfileResponse>> getProfilesByAccount(
            @Parameter(description = "ID of the account") @PathVariable Long accountId,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(profileService.getProfilesByAccount(accountId, JwtUtils.extractEmail(jwt)));
    }

    /**
     * GET /api/profiles/{profileId}
     * Returns details of a specific profile.
     * @param profileId - Id of the profile.
     * @return ProfileResponse with HTTP 200, or 404 if not found.
     */
    @Operation(summary = "Get a profile by ID", description = "Returns details of a specific profile.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Profile found successfully"),
            @ApiResponse(responseCode = "404", description = "Profile not found", content = @Content)
    })
    @GetMapping("/{profileId}")
    public ResponseEntity<ProfileResponse> getProfileById(
            @Parameter(description = "ID of the profile") @PathVariable Long profileId) {
        return ResponseEntity.ok(profileService.getProfileById(profileId));
    }

    /**
     * POST /api/profiles
     * Registers a new profile and associates it with an account.
     * @param request - ProfileRequest containing the profile data.
     * @return ProfileResponse with HTTP 201, or 400 if validation fails.
     */
    @Operation(summary = "Create a new profile", description = "Registers a new profile and associates it with an account.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Profile created successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ProfileResponse.class))),
            @ApiResponse(responseCode = "400", description = "Bad Request (e.g. Invalid role)",
                    content = @Content(mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = "{\n" +
                                            "  \"error\": \"Bad Request\",\n" +
                                            "  \"message\": \"Invalid role: 'pessoa'. Must be one of: ADMIN, GUEST, RESTRICTED\",\n" +
                                            "  \"timestamp\": \"2026-04-22T10:59:14.304Z\",\n" +
                                            "  \"status\": 400\n" +
                                            "}"
                            )))
    })
    @PostMapping
    public ResponseEntity<ProfileResponse> createProfile(@Valid @RequestBody ProfileRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        ProfileResponse created = profileService.createProfile(request, JwtUtils.extractEmail(jwt));
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * PUT /api/profiles/{profileId}
     * Updates the data of an existing profile.
     * @param profileId - Id of the profile.
     * @param request - ProfileRequest containing the updated data.
     * @return ProfileResponse with HTTP 200, or 400/404 if invalid or not found.
     */
    @Operation(summary = "Update a profile", description = "Updates the data of an existing profile.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Profile updated successfully"),
            @ApiResponse(responseCode = "400", description = "Bad Request (e.g. Invalid data)",
                    content = @Content(mediaType = "application/json",
                            examples = @ExampleObject(
                                    value = "{\n" +
                                            "  \"error\": \"Bad Request\",\n" +
                                            "  \"message\": \"Invalid role: 'adminzinho'. Must be one of: ADMIN, GUEST, RESTRICTED\",\n" +
                                            "  \"timestamp\": \"2026-04-22T10:59:14.304Z\",\n" +
                                            "  \"status\": 400\n" +
                                            "}"
                            ))),
            @ApiResponse(responseCode = "404", description = "Profile not found", content = @Content)
    })
    @PutMapping("/{profileId}")
    public ResponseEntity<ProfileResponse> updateProfile(
            @Parameter(description = "ID of the profile") @PathVariable Long profileId,
            @Valid @RequestBody ProfileRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(profileService.updateProfile(profileId, request, JwtUtils.extractEmail(jwt)));
    }

    /**
     * POST /api/profiles/{profileId}/verify-pin
     * Verifies the PIN of a profile.
     * @param profileId - Id of the profile.
     * @param request - PinVerificationRequest containing the PIN.
     * @return HTTP 200 if the PIN is correct, or 403 if incorrect.
     */
    @Operation(summary = "Verify profile PIN", description = "Returns 200 if the PIN is correct, 403 otherwise.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "PIN correct"),
            @ApiResponse(responseCode = "403", description = "PIN incorrect", content = @Content),
            @ApiResponse(responseCode = "404", description = "Profile not found", content = @Content)
    })
    @PostMapping("/{profileId}/verify-pin")
    public ResponseEntity<Void> verifyPin(
            @Parameter(description = "ID of the profile") @PathVariable Long profileId,
            @RequestBody PinVerificationRequest request) {
        boolean valid = profileService.verifyPin(profileId, request.getPin());
        return valid ? ResponseEntity.ok().build() : ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }

    /**
     * DELETE /api/profiles/{profileId}
     * Removes a profile from the system.
     * @param profileId - Id of the profile.
     * @return HTTP 204 if deleted, or 404 if not found.
     */
    @Operation(summary = "Delete a profile", description = "Removes a profile from the system.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Profile deleted successfully", content = @Content),
            @ApiResponse(responseCode = "404", description = "Profile not found", content = @Content)
    })
    @DeleteMapping("/{profileId}")
    public ResponseEntity<Void> deleteProfile(
            @Parameter(description = "ID of the profile") @PathVariable Long profileId,
            @AuthenticationPrincipal Jwt jwt) {
        profileService.deleteProfile(profileId, JwtUtils.extractEmail(jwt));
        return ResponseEntity.noContent().build();
    }
}
