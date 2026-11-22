package pt.deti.iesg304.smarthome.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.media.Content;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import pt.deti.iesg304.smarthome.config.JwtUtils;
import pt.deti.iesg304.smarthome.dto.AlertResponse;
import pt.deti.iesg304.smarthome.service.AlertService;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
@Tag(name = "Alerts", description = "Automation alert management API")
public class AlertController {

    private final AlertService alertService;

    public AlertController(AlertService alertService) {
        this.alertService = alertService;
    }

    @Operation(summary = "List alerts")
    @ApiResponses(@ApiResponse(responseCode = "200", description = "Alerts returned"))
    @GetMapping
    public ResponseEntity<List<AlertResponse>> getAlerts(
            @RequestParam(defaultValue = "false") boolean onlyUnack,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(alertService.getAlerts(JwtUtils.extractEmail(jwt), onlyUnack));
    }

    @Operation(summary = "Acknowledge all alerts")
    @ApiResponses(@ApiResponse(responseCode = "204", description = "All alerts acknowledged"))
    @PatchMapping("/acknowledge-all")
    public ResponseEntity<Void> acknowledgeAll(@AuthenticationPrincipal Jwt jwt) {
        alertService.acknowledgeAll(JwtUtils.extractEmail(jwt));
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Acknowledge an alert")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Alert acknowledged"),
            @ApiResponse(responseCode = "404", description = "Not found", content = @Content)
    })
    @PatchMapping("/{id}/acknowledge")
    public ResponseEntity<AlertResponse> acknowledge(
            @Parameter(description = "Alert ID") @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(alertService.acknowledge(id, JwtUtils.extractEmail(jwt)));
    }
}
