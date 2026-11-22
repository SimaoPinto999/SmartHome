package pt.deti.iesg304.smarthome.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import pt.deti.iesg304.smarthome.model.Role;

import pt.deti.iesg304.smarthome.dto.PermissionRequest;
import pt.deti.iesg304.smarthome.dto.PermissionResponse;
import pt.deti.iesg304.smarthome.model.Device;
import pt.deti.iesg304.smarthome.model.Permission;
import pt.deti.iesg304.smarthome.model.Profile;
import pt.deti.iesg304.smarthome.model.Room;
import pt.deti.iesg304.smarthome.exception.ResourceNotFoundException;
import pt.deti.iesg304.smarthome.repository.DeviceRepository;
import pt.deti.iesg304.smarthome.repository.PermissionRepository;
import pt.deti.iesg304.smarthome.repository.ProfileRepository;
import pt.deti.iesg304.smarthome.repository.RoomRepository;

@Service
public class PermissionService {

    private final PermissionRepository permissionRepository;
    private final ProfileRepository profileRepository;
    private final DeviceRepository deviceRepository;
    private final RoomRepository roomRepository;

    /**
     * Permission Service constructor.
     * @param permissionRepository Repository for Permission entities.
     * @param profileRepository Repository for Profile entities.
     * @param deviceRepository Repository for Device entities.
     * @param roomRepository Repository for Room entities.
     */
    public PermissionService(PermissionRepository permissionRepository, ProfileRepository profileRepository,
            DeviceRepository deviceRepository, RoomRepository roomRepository) {
        this.permissionRepository = permissionRepository;
        this.profileRepository = profileRepository;
        this.deviceRepository = deviceRepository;
        this.roomRepository = roomRepository;
    }

    /**
     * Lists all permissions granted to a profile.
     * @return List of PermissionResponse.
     */
    public List<PermissionResponse> getAllPermissions() {
        return permissionRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    /**
     * Lists all permissions granted to a profile.
     * @param profileId - Id of the profile.
     * @return List of PermissionResponse.
     */
    public List<PermissionResponse> getPermissionsByProfile(Long profileId) {
        return permissionRepository.findByProfile_ProfileId(profileId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lists all permissions granted to a device.
     * @param deviceId - Id of the device.
     * @return List of PermissionResponse.
     */
    public List<PermissionResponse> getPermissionsByDevice(String deviceId) {
        return permissionRepository.findByDevice_DeviceId(deviceId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lists all permissions granted to a room.
     * @param roomId - Id of the room.
     * @return List of PermissionResponse.
     */
    public List<PermissionResponse> getPermissionsByRoom(Long roomId) {
        return permissionRepository.findByRoom_RoomId(roomId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Returns a permission by id.
     * @param permissionId - Id of the permission.
     * @return PermissionResponse.
     */
    public PermissionResponse getPermissionById(Long permissionId) {
        Permission permission = permissionRepository.findById(permissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Permission not found: " + permissionId));

        return toResponse(permission);
    }

    /**
     * Lists permissions by level (e.g. find all admins).
     * @param permissionLevel - Permission level to filter by.
     * @return List of PermissionResponse.
     */
    public List<PermissionResponse> getPermissionsByLevel(Integer permissionLevel) {
        return permissionRepository.findByPermissionLevel(permissionLevel)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Creates a new permission (must target a device OR a room).
     * @param request - PermissionRequest containing the permission data.
     * @return PermissionResponse.
     */
    public PermissionResponse createPermission(PermissionRequest request, String email) {
        validateTarget(request);

        Profile profile = profileRepository.findById(request.getProfileId())
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found: " + request.getProfileId()));
        requireAdmin(profile.getAccount().getEmail(), email);

        Device device = null;
        if (request.getDeviceId() != null) {
            device = deviceRepository.findById(request.getDeviceId())
                    .orElseThrow(() -> new ResourceNotFoundException("Device not found: " + request.getDeviceId()));
        }

        Room room = null;
        if (request.getRoomId() != null) {
            room = roomRepository.findById(request.getRoomId())
                    .orElseThrow(() -> new ResourceNotFoundException("Room not found: " + request.getRoomId()));
        }

        Permission permission = toModel(request, profile, device, room);
        Permission saved = permissionRepository.save(permission);

        return toResponse(saved);
    }

    /**
     * Updates the permission level of an existing permission.
     * @param permissionId - Id of the permission.
     * @param request - PermissionRequest containing the permission data.
     * @return PermissionResponse.
     */
    public PermissionResponse updatePermission(Long permissionId, PermissionRequest request, String email) {
        Permission permission = permissionRepository.findById(permissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Permission not found: " + permissionId));
        requireAdmin(permission.getProfile().getAccount().getEmail(), email);

        permission.setPermissionLevel(request.getPermissionLevel());

        return toResponse(permissionRepository.save(permission));
    }

    /**
     * Removes a permission by id.
     * @param permissionId - Id of the permission.
     */
    public void deletePermission(Long permissionId, String email) {
        Permission permission = permissionRepository.findById(permissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Permission not found: " + permissionId));
        requireAdmin(permission.getProfile().getAccount().getEmail(), email);
        permissionRepository.deleteById(permissionId);
    }

    /**
     * Validates the target of a permission.
     * @param request - PermissionRequest containing the permission data.
     */
    private void requireAdmin(String accountEmail, String jwtEmail) {
        if (!accountEmail.equals(jwtEmail)) throw new AccessDeniedException("Forbidden");
        profileRepository.findByAccount_Email(jwtEmail).stream()
                .filter(p -> p.getRole() == Role.ADMIN)
                .findAny()
                .orElseThrow(() -> new AccessDeniedException("Forbidden: ADMIN role required"));
    }

    private void validateTarget(PermissionRequest request) {
        if (request.getDeviceId() == null && request.getRoomId() == null) {
            throw new IllegalArgumentException("Permission must target a device or a room");
        }
    }

    /**
     * Converts a Permission entity to a PermissionResponse.
     * @param permission - Permission entity.
     * @return PermissionResponse.
     */
    private PermissionResponse toResponse(Permission permission) {
        return new PermissionResponse(
                permission.getPermissionId(),
                permission.getProfile().getProfileId(),
                permission.getDevice() != null ? permission.getDevice().getDeviceId() : null,
                permission.getRoom() != null ? permission.getRoom().getRoomId() : null,
                permission.getPermissionLevel()
        );
    }

    /**
     * Converts a PermissionRequest to a Permission entity.
     * @param request - PermissionRequest containing the permission data.
     * @param profile - Profile entity.
     * @param device - Device entity.
     * @param room - Room entity.
     * @return Permission entity.
     */
    private Permission toModel(PermissionRequest request, Profile profile, Device device, Room room) {
        Permission permission = new Permission();
        permission.setPermissionLevel(request.getPermissionLevel());
        permission.setProfile(profile);
        permission.setDevice(device);
        permission.setRoom(room);

        return permission;
    }
}
