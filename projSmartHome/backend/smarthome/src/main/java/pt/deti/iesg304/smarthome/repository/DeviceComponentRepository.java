package pt.deti.iesg304.smarthome.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pt.deti.iesg304.smarthome.model.DeviceComponent;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface DeviceComponentRepository extends JpaRepository<DeviceComponent, Long> {

    Optional<DeviceComponent> findByMqttTopic(String mqttTopic);
    
    List<DeviceComponent> findByDevice_DeviceId(String deviceId);

    List<DeviceComponent> findByComponentName(String componentName);

    List<DeviceComponent> findByComponentType(String componentType);

    List<DeviceComponent> findBySensorType(String sensorType);

    List<DeviceComponent> findByActuatorType(String actuatorType);

    List<DeviceComponent> findByDevice_Room_House_HouseId(Long houseId);

    List<DeviceComponent> findByDevice_Room_House_HouseIdAndNominalWattsGreaterThan(Long houseId, BigDecimal nominalWatts);

    List<DeviceComponent> findByDevice_Room_House_HouseIdAndSensorType(Long houseId, String sensorType);
}