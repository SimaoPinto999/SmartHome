package pt.deti.iesg304.smarthome.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import pt.deti.iesg304.smarthome.config.JwtUtils;
import pt.deti.iesg304.smarthome.dto.TimeBasedRuleRequest;
import pt.deti.iesg304.smarthome.dto.TimeBasedRuleResponse;
import pt.deti.iesg304.smarthome.service.TimeBasedRuleService;

@RestController
@RequestMapping("/api/time-rules")
@Tag(name = "Time-Based Rules", description = "Sunset/sunrise triggered automation rules")
public class TimeBasedRuleController {

    private final TimeBasedRuleService service;

    public TimeBasedRuleController(TimeBasedRuleService service) {
        this.service = service;
    }

    @Operation(summary = "List all time-based rules for the authenticated house")
    @GetMapping
    public ResponseEntity<List<TimeBasedRuleResponse>> getAll(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(service.getAllRules(JwtUtils.extractEmail(jwt)));
    }

    @Operation(summary = "Get a time-based rule by ID")
    @GetMapping("/{id}")
    public ResponseEntity<TimeBasedRuleResponse> getOne(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(service.getRuleById(id, JwtUtils.extractEmail(jwt)));
    }

    @Operation(summary = "Create a time-based rule")
    @PostMapping
    public ResponseEntity<TimeBasedRuleResponse> create(
            @RequestBody TimeBasedRuleRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.createRule(request, JwtUtils.extractEmail(jwt)));
    }

    // função apenas para fins de demonstração
    @Operation(summary = "Trigger a time-based rule manually")
    @PostMapping("/{id}/trigger")
    public ResponseEntity<Void> triggerNow(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        service.triggerNow(id, JwtUtils.extractEmail(jwt));
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Update a time-based rule")
    @PutMapping("/{id}")
    public ResponseEntity<TimeBasedRuleResponse> update(
            @PathVariable Long id,
            @RequestBody TimeBasedRuleRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(service.updateRule(id, request, JwtUtils.extractEmail(jwt)));
    }

    @Operation(summary = "Delete a time-based rule")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        service.deleteRule(id, JwtUtils.extractEmail(jwt));
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Enable or disable a time-based rule")
    @PatchMapping("/{id}/enabled")
    public ResponseEntity<TimeBasedRuleResponse> toggleEnabled(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> body,
            @AuthenticationPrincipal Jwt jwt) {
        boolean enabled = Boolean.TRUE.equals(body.get("enabled"));
        return ResponseEntity.ok(service.toggleEnabled(id, enabled, JwtUtils.extractEmail(jwt)));
    }
}