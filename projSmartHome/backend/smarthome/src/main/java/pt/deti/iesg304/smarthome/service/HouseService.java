package pt.deti.iesg304.smarthome.service;

import org.springframework.stereotype.Service;
import pt.deti.iesg304.smarthome.dto.HouseRequest;
import pt.deti.iesg304.smarthome.dto.HouseResponse;
import pt.deti.iesg304.smarthome.model.Account;
import pt.deti.iesg304.smarthome.model.House;
import pt.deti.iesg304.smarthome.exception.ResourceNotFoundException;
import pt.deti.iesg304.smarthome.model.ActivityLog;
import pt.deti.iesg304.smarthome.repository.ActivityLogRepository;
import pt.deti.iesg304.smarthome.repository.AccountRepository;
import pt.deti.iesg304.smarthome.repository.HouseRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.TimeZone;
import java.util.stream.Collectors;

@Service
public class HouseService {

    private final HouseRepository houseRepository;
    private final AccountRepository accountRepository;
    private final ActivityLogRepository activityLogRepository;

    /**
     * House Service constructor.
     * @param houseRepository Repository for House entities.
     * @param accountRepository Repository for Account entities.
     */
    public HouseService(HouseRepository houseRepository, AccountRepository accountRepository, ActivityLogRepository activityLogRepository) {
        this.houseRepository = houseRepository;
        this.accountRepository = accountRepository;
        this.activityLogRepository = activityLogRepository;
    }

    /**
     * Lists all houses.
     * @return List of HouseResponse.
     */
    public List<HouseResponse> getAllHouses() {
        return houseRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    /**
     * Lists all houses belonging to an account.
     * @param accountId - Id of the account.
     * @return List of HouseResponse.
     */
    public List<HouseResponse> getHousesByAccount(Long accountId) {
        return houseRepository.findByAccount_AccountId(accountId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Returns a house by id.
     * @param houseId - Id of the house.
     * @return HouseResponse.
     */
    public HouseResponse getHouseById(Long houseId) {
        House house = houseRepository.findById(houseId)
                .orElseThrow(() -> new ResourceNotFoundException("House not found: " + houseId));

        return toResponse(house);
    }

    /**
     * Creates a new house.
     * @param request - HouseRequest containing the house data.
     * @return HouseResponse.
     */
    public HouseResponse createHouse(HouseRequest request) {
        Account account = accountRepository.findById(request.getAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + request.getAccountId()));
        try {
            TimeZone.getTimeZone(request.getTimezone());
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid timezone: " + request.getTimezone());
        }
        House house = toModel(request, account);
        House saved = houseRepository.save(house);

        return toResponse(saved);
    }

    /**
     * Updates the fields of an existing house.
     * @param houseId - Id of the house.
     * @param request - HouseRequest containing the house data.
     * @return HouseResponse.
     */
    public HouseResponse updateHouse(Long houseId, HouseRequest request) {
        House house = houseRepository.findById(houseId)
                .orElseThrow(() -> new ResourceNotFoundException("House not found: " + houseId));

        try {
            TimeZone.getTimeZone(request.getTimezone());
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid timezone: " + request.getTimezone());
        }

        house.setHouseName(request.getHouseName());
        house.setAddress(request.getAddress());
        house.setTimezone(request.getTimezone());

        return toResponse(houseRepository.save(house));
    }

    /**
     * Removes a house by id.
     * @param houseId - Id of the house.
     */
    public void deleteHouse(Long houseId) {
        if (!houseRepository.existsById(houseId)) {
            throw new ResourceNotFoundException("House not found: " + houseId);
        }
        houseRepository.deleteById(houseId);
    }

    /**
     * Converts a House entity to a HouseResponse.
     * @param house - House entity.
     * @return HouseResponse.
     */
    public HouseResponse setAlarmArmed(Long houseId, boolean armed, String email) {
        House house = houseRepository.findById(houseId)
                .orElseThrow(() -> new ResourceNotFoundException("House not found: " + houseId));

        if (house.getAccount() == null || !house.getAccount().getEmail().equalsIgnoreCase(email)) {
            throw new ResourceNotFoundException("House not found: " + houseId);
        }

        if (house.getAlarmArmed() != armed) {
            ActivityLog log = new ActivityLog();
            log.setHouse(house);
            log.setEventType("SYSTEM");
            log.setMessage(armed ? "System Armed" : "System Disarmed");
            log.setTimestamp(LocalDateTime.now());
            activityLogRepository.save(log);
        }

        house.setAlarmArmed(armed);
        return toResponse(houseRepository.save(house));
    }

    private HouseResponse toResponse(House house) {
        return new HouseResponse(
                house.getHouseId(),
                house.getAccount().getAccountId(),
                house.getHouseName(),
                house.getAddress(),
                house.getTimezone(),
                house.getAlarmArmed()
        );
    }

    /**
     * Converts a HouseRequest to a House entity.
     * @param request - HouseRequest containing the house data.
     * @param account - Account entity.
     * @return House entity.
     */
    private House toModel(HouseRequest request, Account account) {
        House house = new House();
        house.setHouseName(request.getHouseName());
        house.setAddress(request.getAddress());
        house.setTimezone(request.getTimezone());
        house.setAccount(account);

        return house;
    }
}
