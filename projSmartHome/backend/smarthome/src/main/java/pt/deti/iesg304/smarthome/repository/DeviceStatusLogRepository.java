package pt.deti.iesg304.smarthome.repository;

import java.time.LocalDateTime;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pt.deti.iesg304.smarthome.model.DeviceStatusLog;

import java.util.List;

@Repository
public interface DeviceStatusLogRepository extends JpaRepository<DeviceStatusLog, Long> {

    List<DeviceStatusLog> findByStatusValue(String statusValue);

    List<DeviceStatusLog> findByTimestamp(LocalDateTime timestamp);

    List<DeviceStatusLog> findByDevice_DeviceId(String deviceId);

}
