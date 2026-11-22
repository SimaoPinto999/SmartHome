package pt.deti.iesg304.smarthome.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.media.Content;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import pt.deti.iesg304.smarthome.config.JwtUtils;
import pt.deti.iesg304.smarthome.dto.AutomationRuleRequest;
import pt.deti.iesg304.smarthome.dto.AutomationRuleResponse;
import pt.deti.iesg304.smarthome.service.AutomationService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/automations")
@Tag(name = "Automations", description = "Automation rule management API")
public class AutomationController {

    private final AutomationService automationService;

    public AutomationController(AutomationService automationService) {
        this.automationService = automationService;
    }

    @Operation(summary = "List automation rules")
    @ApiResponses(@ApiResponse(responseCode = "200", description = "Rules returned"))
    @GetMapping
    public ResponseEntity<List<AutomationRuleResponse>> getRules(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(automationService.getAllRules(JwtUtils.extractEmail(jwt)));
    }

    @Operation(summary = "Get automation rule by ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Rule returned"),
            @ApiResponse(responseCode = "404", description = "Not found", content = @Content)
    })
    @GetMapping("/{id}")
    public ResponseEntity<AutomationRuleResponse> getRule(
            @Parameter(description = "Rule ID") @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(automationService.getRuleById(id, JwtUtils.extractEmail(jwt)));
    }

    @Operation(summary = "Create automation rule")
    @ApiResponses(@ApiResponse(responseCode = "201", description = "Rule created"))
    @PostMapping
    public ResponseEntity<AutomationRuleResponse> createRule(
            @RequestBody AutomationRuleRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(automationService.createRule(request, JwtUtils.extractEmail(jwt)));
    }

    @Operation(summary = "Update automation rule")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Rule updated"),
            @ApiResponse(responseCode = "404", description = "Not found", content = @Content)
    })
    @PutMapping("/{id}")
    public ResponseEntity<AutomationRuleResponse> updateRule(
            @Parameter(description = "Rule ID") @PathVariable Long id,
            @RequestBody AutomationRuleRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(automationService.updateRule(id, request, JwtUtils.extractEmail(jwt)));
    }

    @Operation(summary = "Delete automation rule")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Rule deleted", content = @Content),
            @ApiResponse(responseCode = "404", description = "Not found", content = @Content)
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRule(
            @Parameter(description = "Rule ID") @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        automationService.deleteRule(id, JwtUtils.extractEmail(jwt));
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Toggle rule enabled/disabled")
    @ApiResponses(@ApiResponse(responseCode = "200", description = "Rule toggled"))
    @PatchMapping("/{id}/enabled")
    public ResponseEntity<AutomationRuleResponse> toggleEnabled(
            @Parameter(description = "Rule ID") @PathVariable Long id,
            @RequestBody Map<String, Boolean> body,
            @AuthenticationPrincipal Jwt jwt) {
        boolean enabled = Boolean.TRUE.equals(body.get("enabled"));
        return ResponseEntity.ok(automationService.toggleEnabled(id, enabled, JwtUtils.extractEmail(jwt)));
    }
}
