package pt.deti.iesg304.smarthome.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pt.deti.iesg304.smarthome.model.House;

import java.util.List;
import java.util.Optional;

@Repository
public interface HouseRepository extends JpaRepository<House, Long> {
    
    List<House> findByAccount_AccountId(Long accountId);

    List<House> findByHouseName(String houseName);

    List<House> findByAddressContainingIgnoreCase(String address);

    @Query("SELECT c.device.room.house FROM DeviceComponent c WHERE c.componentId = :componentId")
    Optional<House> findByComponentId(@Param("componentId") Long componentId);

}
