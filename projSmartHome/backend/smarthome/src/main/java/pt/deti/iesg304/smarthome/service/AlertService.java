package pt.deti.iesg304.smarthome.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pt.deti.iesg304.smarthome.dto.AlertResponse;
import pt.deti.iesg304.smarthome.exception.ResourceNotFoundException;
import pt.deti.iesg304.smarthome.model.Alert;
import pt.deti.iesg304.smarthome.model.House;
import pt.deti.iesg304.smarthome.repository.AlertRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AlertService {

    private final AlertRepository alertRepository;
    private final HouseResolver houseResolver;

    public AlertService(AlertRepository alertRepository, HouseResolver houseResolver) {
        this.alertRepository = alertRepository;
        this.houseResolver = houseResolver;
    }

    @Transactional(readOnly = true)
    public List<AlertResponse> getAlerts(String email, boolean onlyUnack) {
        House house = houseResolver.resolve(email);
        List<Alert> alerts = onlyUnack
                ? alertRepository.findByRule_House_HouseIdAndAcknowledgedFalseOrderByTriggeredAtDesc(house.getHouseId())
                : alertRepository.findByRule_House_HouseIdOrderByTriggeredAtDesc(house.getHouseId());
        return alerts.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public void acknowledgeAll(String email) {
        House house = houseResolver.resolve(email);
        List<Alert> unacked = alertRepository.findByRule_House_HouseIdAndAcknowledgedFalseOrderByTriggeredAtDesc(house.getHouseId());
        unacked.forEach(a -> a.setAcknowledged(true));
        alertRepository.saveAll(unacked);
    }

    @Transactional
    public AlertResponse acknowledge(Long alertId, String email) {
        House house = houseResolver.resolve(email);
        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new ResourceNotFoundException("Alert not found: " + alertId));
        if (!alert.getRule().getHouse().getHouseId().equals(house.getHouseId()))
            throw new ResourceNotFoundException("Alert not found: " + alertId);
        alert.setAcknowledged(true);
        return toResponse(alertRepository.save(alert));
    }

    private AlertResponse toResponse(Alert alert) {
        return new AlertResponse(
                alert.getAlertId(),
                alert.getRule().getRuleId(),
                alert.getRule().getName(),
                alert.getMessage(),
                alert.getSeverity(),
                alert.getTriggeredAt(),
                alert.getAcknowledged(),
                alert.getAlertType()
        );
    }
}
