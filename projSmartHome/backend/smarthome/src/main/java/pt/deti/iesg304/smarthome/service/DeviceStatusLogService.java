package pt.deti.iesg304.smarthome.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import pt.deti.iesg304.smarthome.dto.DeviceStatusLogRequest;
import pt.deti.iesg304.smarthome.dto.DeviceStatusLogResponse;
import pt.deti.iesg304.smarthome.model.Device;
import pt.deti.iesg304.smarthome.model.DeviceStatusLog;
import pt.deti.iesg304.smarthome.exception.ResourceNotFoundException;
import pt.deti.iesg304.smarthome.repository.DeviceRepository;
import pt.deti.iesg304.smarthome.repository.DeviceStatusLogRepository;

@Service
public class DeviceStatusLogService {

    private final DeviceStatusLogRepository deviceStatusLogRepository;
    private final DeviceRepository deviceRepository;

    /**
     * Device Status Log Service constructor.
     * @param deviceStatusLogRepository Repository for DeviceStatusLog entities.
     * @param deviceRepository Repository for Device entities.
     */
    public DeviceStatusLogService(DeviceStatusLogRepository deviceStatusLogRepository, DeviceRepository deviceRepository) {
        this.deviceStatusLogRepository = deviceStatusLogRepository;
        this.deviceRepository = deviceRepository;
    }

    /**
     * Lists all status logs of a device.
     * @param deviceId - Id of the device.
     * @return List of DeviceStatusLogResponse.
     */
    public List<DeviceStatusLogResponse> getLogsByDevice(String deviceId) {
        return deviceStatusLogRepository.findByDevice_DeviceId(deviceId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Returns a status log by id.
     * @param logId - Id of the log.
     * @return DeviceStatusLogResponse.
     */
    public DeviceStatusLogResponse getLogById(Long logId) {
        DeviceStatusLog log = deviceStatusLogRepository.findById(logId)
                .orElseThrow(() -> new ResourceNotFoundException("Log not found: " + logId));

        return toResponse(log);
    }

    /**
     * Lists logs by status value (e.g. "ONLINE", "OFFLINE").
     * @param statusValue - Status value to filter by.
     * @return List of DeviceStatusLogResponse.
     */
    public List<DeviceStatusLogResponse> getLogsByStatus(String statusValue) {
        return deviceStatusLogRepository.findByStatusValue(statusValue)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Records a new status log entry (timestamp set server-side).
     * @param request - DeviceStatusLogRequest containing the log data.
     * @return DeviceStatusLogResponse.
     */
    public DeviceStatusLogResponse createLog(DeviceStatusLogRequest request) {
        Device device = deviceRepository.findById(request.getDeviceId())
                .orElseThrow(() -> new ResourceNotFoundException("Device not found: " + request.getDeviceId()));
        DeviceStatusLog log = toModel(request, device);
        log.setTimestamp(LocalDateTime.now());
        DeviceStatusLog saved = deviceStatusLogRepository.save(log);

        return toResponse(saved);
    }

    /**
     * Removes a status log by id.
     * @param logId - Id of the log.
     */
    public void deleteLog(Long logId) {
        if (!deviceStatusLogRepository.existsById(logId)) {
            throw new ResourceNotFoundException("Log not found: " + logId);
        }
        deviceStatusLogRepository.deleteById(logId);
    }

    /**
     * Converts a DeviceStatusLog entity to a DeviceStatusLogResponse.
     * @param log - DeviceStatusLog entity.
     * @return DeviceStatusLogResponse.
     */
    private DeviceStatusLogResponse toResponse(DeviceStatusLog log) {
        return new DeviceStatusLogResponse(
                log.getLogId(),
                log.getDevice().getDeviceId(),
                log.getStatusValue(),
                log.getTimestamp()
        );
    }

    /**
     * Converts a DeviceStatusLogRequest to a DeviceStatusLog entity.
     * @param request - DeviceStatusLogRequest containing the log data.
     * @param device - Device entity.
     * @return DeviceStatusLog entity.
     */
    private DeviceStatusLog toModel(DeviceStatusLogRequest request, Device device) {
        DeviceStatusLog log = new DeviceStatusLog();
        log.setStatusValue(request.getStatusValue());
        log.setDevice(device);

        return log;
    }
}
