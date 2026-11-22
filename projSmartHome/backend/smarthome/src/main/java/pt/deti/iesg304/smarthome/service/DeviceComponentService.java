package pt.deti.iesg304.smarthome.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import pt.deti.iesg304.smarthome.dto.DeviceComponentRequest;
import pt.deti.iesg304.smarthome.dto.DeviceComponentResponse;
import pt.deti.iesg304.smarthome.model.Device;
import pt.deti.iesg304.smarthome.model.DeviceComponent;
import pt.deti.iesg304.smarthome.exception.ResourceNotFoundException;
import pt.deti.iesg304.smarthome.repository.DeviceComponentRepository;
import pt.deti.iesg304.smarthome.repository.DeviceRepository;

@Service
public class DeviceComponentService {

    private final DeviceComponentRepository deviceComponentRepository;
    private final DeviceRepository deviceRepository;

    /**
     * Device Component Service constructor.
     * @param deviceComponentRepository Repository for DeviceComponent entities.
     * @param deviceRepository Repository for Device entities.
     */
    public DeviceComponentService(DeviceComponentRepository deviceComponentRepository, DeviceRepository deviceRepository) {
        this.deviceComponentRepository = deviceComponentRepository;
        this.deviceRepository = deviceRepository;
    }

    /**
     * Lists all components belonging to a house.
     * @param houseId - Id of the house.
     * @return List of DeviceComponentResponse.
     */
    public List<DeviceComponentResponse> getComponentsByHouse(Long houseId) {
        return deviceComponentRepository.findByDevice_Room_House_HouseId(houseId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lists all components belonging to a device.
     * @param deviceId - Id of the device.
     * @return List of DeviceComponentResponse.
     */
    public List<DeviceComponentResponse> getComponentsByDevice(String deviceId) {
        return deviceComponentRepository.findByDevice_DeviceId(deviceId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lists all components across all devices.
     * @return List of DeviceComponentResponse.
     */
    public List<DeviceComponentResponse> getAllComponents() {
        return deviceComponentRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Returns a component by id.
     * @param componentId - Id of the component.
     * @return DeviceComponentResponse.
     */
    public DeviceComponentResponse getComponentById(Long componentId) {
        DeviceComponent component = deviceComponentRepository.findById(componentId)
                .orElseThrow(() -> new ResourceNotFoundException("Component not found: " + componentId));
        return toResponse(component);
    }

    /**
     * Returns the component bound to a given MQTT topic.
     * @param mqttTopic - MQTT topic of the component.
     * @return DeviceComponentResponse.
     */
    public DeviceComponentResponse getComponentByMqttTopic(String mqttTopic) {
        DeviceComponent component = deviceComponentRepository.findByMqttTopic(mqttTopic)
                .orElseThrow(() -> new ResourceNotFoundException("Component not found for topic: " + mqttTopic));
        return toResponse(component);
    }

    /**
     * Registers a new component attached to a device.
     * @param request - DeviceComponentRequest containing the component data.
     * @return DeviceComponentResponse.
     */
    public DeviceComponentResponse createComponent(DeviceComponentRequest request) {
        Device device = deviceRepository.findById(request.getDeviceId())
                .orElseThrow(() -> new ResourceNotFoundException("Device not found: " + request.getDeviceId()));
        if (request.getMqttTopic() == null || request.getMqttTopic().isBlank()) {
            request.setMqttTopic(generateMqttTopic(device, request));
        }
        DeviceComponent component = toModel(request, device);
        DeviceComponent saved = deviceComponentRepository.save(component);
        return toResponse(saved);
    }

    /**
     * Updates the fields of an existing component.
     * @param componentId - Id of the component.
     * @param request - DeviceComponentRequest containing the component data.
     * @return DeviceComponentResponse.
     */
    public DeviceComponentResponse updateComponent(Long componentId, DeviceComponentRequest request) {
        DeviceComponent component = deviceComponentRepository.findById(componentId)
                .orElseThrow(() -> new ResourceNotFoundException("Component not found: " + componentId));
        Device device = deviceRepository.findById(request.getDeviceId())
                .orElseThrow(() -> new ResourceNotFoundException("Device not found: " + request.getDeviceId()));

        component.setComponentName(request.getComponentName());
        component.setComponentType(request.getComponentType());
        component.setSensorType(request.getSensorType());
        component.setActuatorType(request.getActuatorType());
        component.setUnit(request.getUnit());
        if (request.getMqttTopic() != null && !request.getMqttTopic().isBlank()) {
            component.setMqttTopic(request.getMqttTopic());
        }
        component.setNominalWatts(request.getNominalWatts());
        component.setDevice(device);

        return toResponse(deviceComponentRepository.save(component));
    }

    /**
     * Removes a component by id.
     * @param componentId - Id of the component.
     */
    public void deleteComponent(Long componentId) {
        if (!deviceComponentRepository.existsById(componentId)) {
            throw new ResourceNotFoundException("Component not found: " + componentId);
        }
        deviceComponentRepository.deleteById(componentId);
    }

    /**
     * Converts a DeviceComponent entity to a DeviceComponentResponse.
     * @param component - DeviceComponent entity.
     * @return DeviceComponentResponse.
     */
    private DeviceComponentResponse toResponse(DeviceComponent component) {
        return new DeviceComponentResponse(
                component.getComponentId(),
                component.getDevice().getDeviceId(),
                component.getComponentName(),
                component.getComponentType(),
                component.getSensorType(),
                component.getActuatorType(),
                component.getUnit(),
                component.getMqttTopic(),
                component.getNominalWatts()
        );
    }

    private static final java.util.Map<String, String> ROOM_SLUG = java.util.Map.ofEntries(
        java.util.Map.entry("LIVING_ROOM", "living"),
        java.util.Map.entry("KITCHEN",     "kitchen"),
        java.util.Map.entry("BEDROOM",     "bedroom"),
        java.util.Map.entry("OFFICE",      "office"),
        java.util.Map.entry("GARAGE",      "garage"),
        java.util.Map.entry("OUTSIDE",     "garden"),
        java.util.Map.entry("BATHROOM",    "bathroom"),
        java.util.Map.entry("HALLWAY",     "hallway")
    );

    private static final java.util.Map<String, String> COMPONENT_SLUG = java.util.Map.ofEntries(
        java.util.Map.entry("TEMPERATURE", "temp"),
        java.util.Map.entry("CONTACT",     "contact"),
        java.util.Map.entry("MOTION",      "motion"),
        java.util.Map.entry("POWER",       "power"),
        java.util.Map.entry("SMOKE",       "smoke"),
        java.util.Map.entry("RAIN",        "rain"),
        java.util.Map.entry("LIGHT",       "lux"),
        java.util.Map.entry("HVAC",        "thermostat"),
        java.util.Map.entry("MOTOR",       "motor"),
        java.util.Map.entry("VALVE",       "valve")
    );

    private String generateMqttTopic(Device device, DeviceComponentRequest request) {
        long houseId = device.getRoom().getHouse().getHouseId();
        String roomSlug = ROOM_SLUG.getOrDefault(device.getRoom().getRoomType(),
                device.getRoom().getRoomType().toLowerCase());
        String specificType = "ACTUATOR".equalsIgnoreCase(request.getComponentType())
                ? request.getActuatorType()
                : request.getSensorType();
        String typeSlug = COMPONENT_SLUG.getOrDefault(specificType != null ? specificType.toUpperCase() : "",
                specificType != null ? specificType.toLowerCase() : "sensor");

        String base = "home/" + houseId + "/" + roomSlug + "/" + typeSlug;
        if (!deviceComponentRepository.findByMqttTopic(base).isPresent()) {
            return base;
        }
        int counter = 2;
        while (deviceComponentRepository.findByMqttTopic(base + "-" + counter).isPresent()) {
            counter++;
        }
        return base + "-" + counter;
    }

    /**
     * Converts a DeviceComponentRequest to a DeviceComponent entity.
     * @param request - DeviceComponentRequest containing the component data.
     * @param device - Device entity.
     * @return DeviceComponent entity.
     */
    private DeviceComponent toModel(DeviceComponentRequest request, Device device) {
        DeviceComponent component = new DeviceComponent();
        component.setComponentName(request.getComponentName());
        component.setComponentType(request.getComponentType());
        component.setSensorType(request.getSensorType());
        component.setActuatorType(request.getActuatorType());
        component.setUnit(request.getUnit());
        component.setMqttTopic(request.getMqttTopic());
        component.setNominalWatts(request.getNominalWatts());
        component.setDevice(device);
        return component;
    }
}