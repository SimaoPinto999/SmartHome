package pt.deti.iesg304.smarthome.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import pt.deti.iesg304.smarthome.dto.ActivityLogResponse;
import pt.deti.iesg304.smarthome.exception.ResourceNotFoundException;
import pt.deti.iesg304.smarthome.model.Account;
import pt.deti.iesg304.smarthome.model.ActivityLog;
import pt.deti.iesg304.smarthome.model.House;
import pt.deti.iesg304.smarthome.repository.AccountRepository;
import pt.deti.iesg304.smarthome.repository.ActivityLogRepository;
import pt.deti.iesg304.smarthome.repository.HouseRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;
    private final AccountRepository accountRepository;
    private final HouseRepository houseRepository;

    public ActivityLogService(ActivityLogRepository activityLogRepository,
                              AccountRepository accountRepository,
                              HouseRepository houseRepository) {
        this.activityLogRepository = activityLogRepository;
        this.accountRepository = accountRepository;
        this.houseRepository = houseRepository;
    }

    private House resolveHouse(String email) {
        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + email));
        List<House> houses = houseRepository.findByAccount_AccountId(account.getAccountId());
        if (houses.isEmpty()) throw new ResourceNotFoundException("No house found for: " + email);
        return houses.get(0);
    }

    public Page<ActivityLogResponse> getLogsByEmail(String email, Long roomId, String eventType, LocalDateTime from, LocalDateTime to, String search, int page, int limit) {
        House house = resolveHouse(email);
        LocalDateTime effectiveFrom = from != null ? from : LocalDateTime.of(1970, 1, 1, 0, 0);
        LocalDateTime effectiveTo = to != null ? to : LocalDateTime.of(9999, 12, 31, 23, 59, 59);
        String safeSearch = (search == null) ? "" : search;

        Page<ActivityLog> logs = activityLogRepository.findLogs(house.getHouseId(), roomId, eventType, effectiveFrom, effectiveTo, safeSearch, PageRequest.of(page, limit));
        return logs.map(this::toResponse);
    }

    private ActivityLogResponse toResponse(ActivityLog log) {
        ActivityLogResponse response = new ActivityLogResponse();
        response.setLogId(log.getLogId());
        response.setHouseId(log.getHouse().getHouseId());
        response.setEventType(log.getEventType());
        response.setMessage(log.getMessage());
        response.setTimestamp(log.getTimestamp());

        if (log.getComponent() != null) {
            response.setComponentId(log.getComponent().getComponentId());
            response.setComponentName(log.getComponent().getComponentName());
            if (log.getComponent().getDevice() != null) {
                response.setDeviceName(log.getComponent().getDevice().getDeviceName());
                if (log.getComponent().getDevice().getRoom() != null) {
                    response.setRoomId(log.getComponent().getDevice().getRoom().getRoomId());
                    response.setRoomName(log.getComponent().getDevice().getRoom().getRoomName());
                }
            }
        }
        return response;
    }
}
