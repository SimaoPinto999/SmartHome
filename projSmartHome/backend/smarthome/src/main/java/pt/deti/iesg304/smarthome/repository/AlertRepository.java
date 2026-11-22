package pt.deti.iesg304.smarthome.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pt.deti.iesg304.smarthome.model.Alert;

import java.util.List;

public interface AlertRepository extends JpaRepository<Alert, Long> {

    List<Alert> findByRule_House_HouseIdAndAcknowledgedFalseOrderByTriggeredAtDesc(Long houseId);

    List<Alert> findByRule_House_HouseIdOrderByTriggeredAtDesc(Long houseId);
}
