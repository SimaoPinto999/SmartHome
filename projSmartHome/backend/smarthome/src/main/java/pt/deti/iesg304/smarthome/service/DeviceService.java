package pt.deti.iesg304.smarthome.service;

import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import pt.deti.iesg304.smarthome.dto.DeviceRequest;
import pt.deti.iesg304.smarthome.dto.DeviceResponse;
import pt.deti.iesg304.smarthome.dto.RoomResponse;
import pt.deti.iesg304.smarthome.model.Device;
import pt.deti.iesg304.smarthome.model.House;
import pt.deti.iesg304.smarthome.model.Room;
import pt.deti.iesg304.smarthome.exception.ResourceNotFoundException;
import pt.deti.iesg304.smarthome.repository.DeviceRepository;
import pt.deti.iesg304.smarthome.repository.RoomRepository;

@Service
public class DeviceService {

    private final DeviceRepository deviceRepository;
    private final RoomRepository roomRepository;
    private final HouseResolver houseResolver;

    public DeviceService(DeviceRepository deviceRepository,
                         RoomRepository roomRepository,
                         HouseResolver houseResolver) {
        this.deviceRepository = deviceRepository;
        this.roomRepository   = roomRepository;
        this.houseResolver    = houseResolver;
    }

    /**
     * Lists all devices belonging to the authenticated user's house.
     * @param email - Email of the authenticated user.
     * @return List of DeviceResponse.
     */
    public List<DeviceResponse> getAllDevices(String email) {
        House house = houseResolver.resolve(email);
        return deviceRepository.findByRoom_House_HouseId(house.getHouseId())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lists all devices belonging to a room, scoped to the authenticated user's house.
     * @param roomId - Id of the room.
     * @param email - Email of the authenticated user.
     * @return List of DeviceResponse.
     */
    public List<DeviceResponse> getDevicesByRoom(Long roomId, String email) {
        House house = houseResolver.resolve(email);
        return deviceRepository.findByRoom_RoomId(roomId)
                .stream()
                .filter(d -> d.getRoom().getHouse().getHouseId().equals(house.getHouseId()))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Returns a device by id, only if it belongs to the authenticated user's house.
     * @param deviceId - Id of the device.
     * @param email - Email of the authenticated user.
     * @return DeviceResponse.
     */
    public DeviceResponse getDeviceById(String deviceId, String email) {
        House house = houseResolver.resolve(email);
        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new ResourceNotFoundException("Device not found: " + deviceId));
        if (!device.getRoom().getHouse().getHouseId().equals(house.getHouseId())) {
            throw new ResourceNotFoundException("Device not found: " + deviceId);
        }
        return toResponse(device);
    }

    /**
     * Lists devices by status (e.g. "ONLINE", "OFFLINE"), scoped to the authenticated user's house.
     * @param status - Status value to filter by.
     * @param email - Email of the authenticated user.
     * @return List of DeviceResponse.
     */
    public List<DeviceResponse> getDevicesByStatus(String status, String email) {
        
        House house = houseResolver.resolve(email);
        return deviceRepository.findByStatus(status)
                .stream()
                .filter(d -> d.getRoom().getHouse().getHouseId().equals(house.getHouseId()))
                .map(this::toResponse)
                .collect(Collectors.toList());
                
    }

    /**
     * Registers a new device (initial status "OFFLINE").
     * @param deviceId - Id of the new device.
     * @param request - DeviceRequest containing the device data.
     * @return DeviceResponse.
     */
    public DeviceResponse createDevice(String deviceId, DeviceRequest request) {
        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Room not found: " + request.getRoomId()));
        Device device = toModel(deviceId, request, room);
        Device saved = deviceRepository.save(device);
        return toResponse(saved);
    }

    /**
     * Updates the fields of an existing device (status is not touched here).
     * @param deviceId - Id of the device.
     * @param request - DeviceRequest containing the device data.
     * @return DeviceResponse.
     */
    public DeviceResponse updateDevice(String deviceId, DeviceRequest request) {

        Device device = deviceRepository.findById(deviceId).orElseThrow(() -> new ResourceNotFoundException("Device not found: " + deviceId));
        Room room = roomRepository.findById(request.getRoomId()).orElseThrow(() -> new ResourceNotFoundException("Room not found: " + request.getRoomId()));
        
        device.setDeviceName(request.getDeviceName());
        device.setDeviceType(request.getDeviceType());
        device.setRoom(room);

        return toResponse(deviceRepository.save(device));
    }

    /**
     * Removes a device by id.
     * @param deviceId - Id of the device.
     */
    public void deleteDevice(String deviceId) {
        if (!deviceRepository.existsById(deviceId)) {
            throw new ResourceNotFoundException("Device not found: " + deviceId);
        }
        deviceRepository.deleteById(deviceId);
    }

    /**
     * Converts a Device entity to a DeviceResponse.
     * @param device - Device entity.
     * @return DeviceResponse.
     */
    private DeviceResponse toResponse(Device device) {

        Room room = device.getRoom();
        RoomResponse roomResponse = null;

        if (room != null) {
            roomResponse = new RoomResponse();
            roomResponse.setRoomId(room.getRoomId());
            roomResponse.setRoomName(room.getRoomName());
            roomResponse.setRoomType(room.getRoomType());
            roomResponse.setFloor(room.getFloor());
        }

        return new DeviceResponse(
            device.getDeviceId(),
            room != null ? room.getRoomId() : null,
            device.getDeviceName(),
            device.getDeviceType(),
            device.getStatus(),
            roomResponse
        );

    }

    /**
     * Converts a DeviceRequest to a Device entity.
     * @param deviceId - Id to assign to the new device.
     * @param request - DeviceRequest containing the device data.
     * @param room - Room entity.
     * @return Device entity.
     */
    private Device toModel(String deviceId, DeviceRequest request, Room room) {

        Device device = new Device();
        device.setDeviceId(deviceId);
        device.setDeviceName(request.getDeviceName());
        device.setDeviceType(request.getDeviceType());
        device.setRoom(room);
        return device;

    }
}