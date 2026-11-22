package pt.deti.iesg304.smarthome.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pt.deti.iesg304.smarthome.model.Device;

import java.util.List;

@Repository
public interface DeviceRepository extends JpaRepository<Device, String> {
    
    List<Device> findByRoom_RoomId(Long roomId);

    long countByRoom_RoomId(Long roomId);

    List<Device> findByDeviceName(String deviceName);

    List<Device> findByDeviceType(String deviceType);

    List<Device> findByStatus(String status);

    List<Device> findByRoom_House_HouseId(Long houseId);
 
}
