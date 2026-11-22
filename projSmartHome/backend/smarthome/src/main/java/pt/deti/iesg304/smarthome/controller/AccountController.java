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
import pt.deti.iesg304.smarthome.dto.AccountRequest;
import pt.deti.iesg304.smarthome.dto.AccountResponse;
import pt.deti.iesg304.smarthome.service.AccountService;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
@Tag(name = "Accounts", description = "Accounts management API")
public class AccountController {

    private final AccountService accountService;

    /**
     * Account Controller constructor.
     * @param accountService Service for Account operations.
     */
    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    /**
     * GET /api/accounts/me
     * Returns (or provisions) the account of the authenticated user based on the JWT.
     * @param jwt - JWT token of the authenticated user.
     * @return AccountResponse with HTTP 200.
     */
    @Operation(summary = "Get or provision current account", description = "Returns the account for the authenticated user, creating it on first login.")
    @GetMapping("/me")
    public ResponseEntity<AccountResponse> getOrProvisionMe(@AuthenticationPrincipal Jwt jwt) {
        String email = jwt.getClaimAsString("email");
        if (email == null || email.isBlank()) {
            email = jwt.getClaimAsString("preferred_username");
        }
        return ResponseEntity.ok(accountService.provisionAccount(email));
    }

    /**
     * GET /api/accounts
     * Lists all accounts registered in the system.
     * @return List of AccountResponse with HTTP 200.
     */
    @Operation(summary = "List all accounts", description = "Returns all accounts registered in the system.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Accounts listed successfully")
    })
    @GetMapping
    public ResponseEntity<List<AccountResponse>> getAllAccounts() {
        return ResponseEntity.ok(accountService.getAllAccounts());
    }

    /**
     * GET /api/accounts/{accountId}
     * Returns details of a specific account by ID.
     * @param accountId - Id of the account.
     * @return AccountResponse with HTTP 200, or 404 if not found.
     */
    @Operation(summary = "Get an account by ID", description = "Returns details of a specific account.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Account found successfully"),
            @ApiResponse(responseCode = "404", description = "Account not found", content = @Content)
    })
    @GetMapping("/{accountId}")
    public ResponseEntity<AccountResponse> getAccountById(
            @Parameter(description = "ID of the account") @PathVariable Long accountId) {

        return ResponseEntity.ok(accountService.getAccountById(accountId));
    }

    /**
     * GET /api/accounts/email/{email}
     * Returns details of a specific account by email.
     * @param email - Email of the account.
     * @return AccountResponse with HTTP 200, or 404 if not found.
     */
    @Operation(summary = "Get an account by email", description = "Returns details of a specific account by email.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Account found successfully"),
            @ApiResponse(responseCode = "404", description = "Account not found", content = @Content)
    })
    @GetMapping("/email/{email}")
    public ResponseEntity<AccountResponse> getAccountByEmail(
            @Parameter(description = "Email of the account") @PathVariable String email) {

        return ResponseEntity.ok(accountService.getAccountByEmail(email));
    }

    /**
     * POST /api/accounts
     * Registers a new account.
     * @param request - AccountRequest containing the account data.
     * @return AccountResponse with HTTP 201, or 400 if validation fails.
     */
    @Operation(summary = "Create a new account", description = "Registers a new account.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Account created successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = AccountResponse.class))),
            @ApiResponse(responseCode = "400", description = "Bad Request (e.g. Invalid email)",
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
    public ResponseEntity<AccountResponse> createAccount(@RequestBody AccountRequest request) {
        AccountResponse created = accountService.createAccount(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * PUT /api/accounts/{accountId}
     * Updates the data of an existing account.
     * @param accountId - Id of the account.
     * @param request - AccountRequest containing the updated data.
     * @return AccountResponse with HTTP 200, or 400/404 if invalid or not found.
     */
    @Operation(summary = "Update an account", description = "Updates the data of an existing account.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Account updated successfully"),
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
            @ApiResponse(responseCode = "404", description = "Account not found", content = @Content)
    })
    @PutMapping("/{accountId}")
    public ResponseEntity<AccountResponse> updateAccount(
            @Parameter(description = "ID of the account") @PathVariable Long accountId,
            @RequestBody AccountRequest request) {

        return ResponseEntity.ok(accountService.updateAccount(accountId, request));
    }

    /**
     * DELETE /api/accounts/{accountId}
     * Removes an account from the system.
     * @param accountId - Id of the account.
     * @return HTTP 204 if deleted, or 404 if not found.
     */
    @Operation(summary = "Delete an account", description = "Removes an account from the system.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Account deleted successfully", content = @Content),
            @ApiResponse(responseCode = "404", description = "Account not found", content = @Content)
    })
    @DeleteMapping("/{accountId}")
    public ResponseEntity<Void> deleteAccount(
            @Parameter(description = "ID of the account") @PathVariable Long accountId) {
        accountService.deleteAccount(accountId);
        return ResponseEntity.noContent().build();
    }
}