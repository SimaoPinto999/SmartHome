package pt.deti.iesg304.smarthome.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pt.deti.iesg304.smarthome.model.Permission;

import java.util.List;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, Long> {

    List<Permission> findByProfile_ProfileId(Long profileId);

    List<Permission> findByDevice_DeviceId(String deviceId);

    List<Permission> findByRoom_RoomId(Long roomId);

    List<Permission> findByPermissionLevel(Integer permissionLevel);

}
