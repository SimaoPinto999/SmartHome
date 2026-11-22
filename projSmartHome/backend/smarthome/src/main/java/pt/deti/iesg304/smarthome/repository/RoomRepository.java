package pt.deti.iesg304.smarthome.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pt.deti.iesg304.smarthome.model.Room;
import java.util.List;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {

    List<Room> findByHouse_HouseId(Long houseId);

    List<Room> findByRoomType(String roomType);

    List<Room> findByHouse_HouseIdAndFloor(Long houseId, Integer floor);

}