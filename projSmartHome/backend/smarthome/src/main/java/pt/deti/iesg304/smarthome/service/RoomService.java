package pt.deti.iesg304.smarthome.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import pt.deti.iesg304.smarthome.dto.RoomRequest;
import pt.deti.iesg304.smarthome.dto.RoomResponse;
import pt.deti.iesg304.smarthome.model.House;
import pt.deti.iesg304.smarthome.model.Room;
import pt.deti.iesg304.smarthome.exception.ResourceNotFoundException;
import pt.deti.iesg304.smarthome.repository.DeviceRepository;
import pt.deti.iesg304.smarthome.repository.HouseRepository;
import pt.deti.iesg304.smarthome.repository.RoomRepository;

@Service
public class RoomService {

    private final RoomRepository roomRepository;
    private final DeviceRepository deviceRepository;
    private final HouseRepository houseRepository;

    /**
     * Room Service constructor.
     * @param roomRepository Repository for Room entities.
     * @param deviceRepository Repository for Device entities.
     * @param houseRepository Repository for House entities.
     */
    public RoomService(RoomRepository roomRepository, DeviceRepository deviceRepository, HouseRepository houseRepository) {
        this.roomRepository = roomRepository;
        this.deviceRepository = deviceRepository;
        this.houseRepository = houseRepository;
    }

    /**
     * Lists all rooms belonging to a house.
     * @param houseId - Id of the house.
     * @return List of RoomResponse.
     */
    public List<RoomResponse> getRoomsByHouse(Long houseId) {
        return roomRepository.findByHouse_HouseId(houseId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Returns a room by id.
     * @param roomId - Id of the room.
     * @return RoomResponse.
     */
    public RoomResponse getRoomById(Long roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found: " + roomId));

        return toResponse(room);
    }

    /**
     * Creates a new room.
     * @param request - RoomRequest containing the room data.
     * @return RoomResponse.
     */
    public RoomResponse createRoom(RoomRequest request) {
        House house = houseRepository.findById(request.getHouseId())
                .orElseThrow(() -> new ResourceNotFoundException("House not found: " + request.getHouseId()));
        Room room = toModel(request, house);
        Room saved = roomRepository.save(room);

        return toResponse(saved);
    }

    /**
     * Updates the fields of an existing room.
     * @param roomId - Id of the room.
     * @param request - RoomRequest containing the room data.
     * @return RoomResponse.
     */
    public RoomResponse updateRoom(Long roomId, RoomRequest request) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found: " + roomId));

        room.setRoomName(request.getRoomName());
        room.setRoomType(request.getRoomType());
        room.setFloor(request.getFloor());

        return toResponse(roomRepository.save(room));
    }

    /**
     * Removes a room by id.
     * @param roomId - Id of the room.
     */
    public void deleteRoom(Long roomId) {
        if (!roomRepository.existsById(roomId)) {
            throw new ResourceNotFoundException("Room not found: " + roomId);
        }
        roomRepository.deleteById(roomId);
    }

    /**
     * Converts a Room entity to a RoomResponse.
     * @param room - Room entity.
     * @return RoomResponse.
     */
    private RoomResponse toResponse(Room room) {
        int count = (int) deviceRepository.countByRoom_RoomId(room.getRoomId());
        return new RoomResponse(
                room.getRoomId(),
                room.getRoomName(),
                room.getRoomType(),
                room.getFloor(),
                count
        );
    }

    /**
     * Converts a RoomRequest to a Room entity.
     * @param request - RoomRequest containing the room data.
     * @param house - House entity.
     * @return Room entity.
     */
    private Room toModel(RoomRequest request, House house) {
        Room room = new Room();
        room.setRoomName(request.getRoomName());
        room.setRoomType(request.getRoomType());
        room.setFloor(request.getFloor());
        room.setHouse(house);

        return room;
    }
}
