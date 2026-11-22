package pt.deti.iesg304.smarthome.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.media.Content;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import pt.deti.iesg304.smarthome.config.JwtUtils;
import jakarta.validation.Valid;
import pt.deti.iesg304.smarthome.dto.EnergyPriceRequest;
import pt.deti.iesg304.smarthome.dto.EnergyPriceResponse;
import pt.deti.iesg304.smarthome.dto.EnergySummaryResponse;
import pt.deti.iesg304.smarthome.dto.MetricPointDto;
import pt.deti.iesg304.smarthome.service.EnergyService;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/energy")
@Tag(name = "Energy", description = "Energy consumption and cost analytics API")
public class EnergyController {

    private final EnergyService energyService;

    /**
     * Energy Controller constructor.
     * @param energyService Service for Energy operations.
     */
    public EnergyController(EnergyService energyService) {
        this.energyService = energyService;
    }

    // ─── Price ────────────────────────────────────────────────────────────────

    /**
     * GET /api/energy/price
     * Returns the current active electricity price for the authenticated user's house.
     */
    @Operation(summary = "Get current electricity price", description = "Returns the current active price per kWh for the authenticated user's house.")
    
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Price returned successfully"),
            @ApiResponse(responseCode = "404", description = "No price configured", content = @Content)
    })

    @GetMapping("/price")
    public ResponseEntity<EnergyPriceResponse> getCurrentPrice(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(energyService.getCurrentPrice(JwtUtils.extractEmail(jwt)));
    }

    /**
     * GET /api/energy/price/history
     * Returns the full price history for the authenticated user's house.
     */
    @Operation(summary = "Get electricity price history",description = "Returns all price entries ordered from most recent to oldest.")
    
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Price history returned successfully")
    })

    @GetMapping("/price/history")
    public ResponseEntity<List<EnergyPriceResponse>> getPriceHistory(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(energyService.getPriceHistory(JwtUtils.extractEmail(jwt)));
    }

    /**
     * POST /api/energy/price
     * Adds a new electricity price entry effective immediately.
     * Body: { "pricePerKwh": 0.2150 }
     */
    @Operation(summary = "Set new electricity price", description = "Adds a new price entry effective immediately. Previous prices are preserved in history.")
    
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "New price registered successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid price", content = @Content)
    })
    
    @PostMapping("/price")
    public ResponseEntity<EnergyPriceResponse> addPrice(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody EnergyPriceRequest body) {
        return ResponseEntity.ok(energyService.addPrice(JwtUtils.extractEmail(jwt), body.pricePerKwh()));
    }

    // ─── Summary ──────────────────────────────────────────────────────────────

    /**
     * GET /api/energy/summary?start=...&end=...
     * Returns total consumption (kWh) and cost for a given period.
     * Covers all components with nominal_watts defined.
     * Uptime is determined per component type (actuator, power sensor, passive sensor).
     */
    @Operation(summary = "Get energy consumption summary", description = "Returns total kWh and cost for the given period, broken down by component. " + "Use this endpoint for both current period and historical month queries.")
    
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Summary returned successfully")
    })
    
    @GetMapping("/summary")
    public ResponseEntity<EnergySummaryResponse> getSummary(
            @AuthenticationPrincipal Jwt jwt,
            @Parameter(description = "Period start (ISO 8601)")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @Parameter(description = "Period end (ISO 8601)")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return ResponseEntity.ok(energyService.getSummary(JwtUtils.extractEmail(jwt), start, end));
    }

    // ─── Chart ────────────────────────────────────────────────────────────────

    /**
     * GET /api/energy/chart?start=...&end=...&interval=30m
     * Returns aggregated kWh data points for charting.
     * Sums estimated consumption across all components per time window.
     * interval: 30m, 1h, 6h, 1d
     */
    @Operation(summary = "Get energy chart data", description = "Returns aggregated kWh per time window across all components. " + "Interval examples: 30m, 1h, 6h, 1d.")

    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Chart data returned successfully")
    })
    
    @GetMapping("/chart")
    public ResponseEntity<List<MetricPointDto>> getChartData(
            @AuthenticationPrincipal Jwt jwt,
            @Parameter(description = "Period start (ISO 8601)")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @Parameter(description = "Period end (ISO 8601)")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
            @Parameter(description = "Aggregation interval (e.g. 30m, 1h, 6h, 1d)")
            @RequestParam(defaultValue = "30m") String interval) {
        return ResponseEntity.ok(energyService.getChartData(JwtUtils.extractEmail(jwt), start, end, interval));
    }
}