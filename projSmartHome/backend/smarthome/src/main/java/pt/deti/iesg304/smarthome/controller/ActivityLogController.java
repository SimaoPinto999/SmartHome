package pt.deti.iesg304.smarthome.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import pt.deti.iesg304.smarthome.config.JwtUtils;
import pt.deti.iesg304.smarthome.dto.ActivityLogResponse;
import pt.deti.iesg304.smarthome.service.ActivityLogService;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/activity-logs")
@Tag(name = "Activity Logs", description = "Activity Log management API")
public class ActivityLogController {

    private final ActivityLogService activityLogService;

    public ActivityLogController(ActivityLogService activityLogService) {
        this.activityLogService = activityLogService;
    }

    @Operation(summary = "List activity logs for a house", description = "Returns the latest activity logs for the caller's house. Optional date filters and pagination can be applied.")
    @GetMapping
    public ResponseEntity<Page<ActivityLogResponse>> getLogsByHouse(
            @RequestParam(required = false) Long roomId,
            @RequestParam(required = false) String eventType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int limit,
            @AuthenticationPrincipal Jwt jwt) {

        return ResponseEntity.ok(activityLogService.getLogsByEmail(JwtUtils.extractEmail(jwt), roomId, eventType, from, to, search, page, limit));
    }
}
