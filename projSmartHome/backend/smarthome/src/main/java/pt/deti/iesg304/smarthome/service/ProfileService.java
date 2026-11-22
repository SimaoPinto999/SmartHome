package pt.deti.iesg304.smarthome.service;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import pt.deti.iesg304.smarthome.dto.ProfileRequest;
import pt.deti.iesg304.smarthome.dto.ProfileResponse;
import pt.deti.iesg304.smarthome.model.Account;
import pt.deti.iesg304.smarthome.model.Profile;
import pt.deti.iesg304.smarthome.exception.ResourceNotFoundException;
import pt.deti.iesg304.smarthome.repository.AccountRepository;
import pt.deti.iesg304.smarthome.repository.ProfileRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProfileService {

    private final ProfileRepository profileRepository;
    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Profile Service constructor.
     * @param profileRepository Repository for Profile entities.
     * @param accountRepository Repository for Account entities.
     * @param passwordEncoder Encoder for hashing PINs.
     */
    public ProfileService(ProfileRepository profileRepository, AccountRepository accountRepository, PasswordEncoder passwordEncoder) {
        this.profileRepository = profileRepository;
        this.accountRepository = accountRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Lists all profiles belonging to an account.
     * @param accountId - Id of the account.
     * @return List of ProfileResponse.
     */
    public List<ProfileResponse> getProfilesByAccount(Long accountId, String email) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + accountId));
        if (!account.getEmail().equals(email)) throw new AccessDeniedException("Forbidden");
        return profileRepository.findByAccount_AccountId(accountId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Returns a profile by id.
     * @param profileId - Id of the profile.
     * @return ProfileResponse.
     */
    public ProfileResponse getProfileById(Long profileId) {
        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found: " + profileId));

        return toResponse(profile);
    }

    /**
     * Creates a new profile.
     * @param request - ProfileRequest containing the profile data.
     * @return ProfileResponse.
     */
    public ProfileResponse createProfile(ProfileRequest request, String email) {
        Account account = accountRepository.findById(request.getAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + request.getAccountId()));
        if (!account.getEmail().equals(email)) throw new AccessDeniedException("Forbidden");
        Profile profile = toModel(request, account);
        Profile saved = profileRepository.save(profile);

        return toResponse(saved);
    }

    /**
     * Updates the fields of an existing profile.
     * @param profileId - Id of the profile.
     * @param request - ProfileRequest containing the profile data.
     * @return ProfileResponse.
     */
    public ProfileResponse updateProfile(Long profileId, ProfileRequest request, String email) {
        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found: " + profileId));
        if (!profile.getAccount().getEmail().equals(email)) throw new AccessDeniedException("Forbidden");

        profile.setFirstName(request.getFirstName());
        profile.setLastName(request.getLastName());
        profile.setRole(request.getRole());
        if (request.getPin() != null) profile.setPin(passwordEncoder.encode(request.getPin()));

        return toResponse(profileRepository.save(profile));
    }

    /**
     * Returns true if the given PIN matches the profile's stored PIN.
     * @param profileId - Id of the profile.
     * @param pin - PIN to verify.
     * @return True if the PIN is valid, false otherwise.
     */
    public boolean verifyPin(Long profileId, String pin) {
        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found: " + profileId));
        return pin != null && passwordEncoder.matches(pin, profile.getPin());
    }

    /**
     * Removes a profile by id.
     * @param profileId - Id of the profile.
     */
    public void deleteProfile(Long profileId, String email) {
        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found: " + profileId));
        if (!profile.getAccount().getEmail().equals(email)) throw new AccessDeniedException("Forbidden");
        profileRepository.deleteById(profileId);
    }

    /**
     * Converts a Profile entity to a ProfileResponse.
     * @param profile - Profile entity.
     * @return ProfileResponse.
     */
    private ProfileResponse toResponse(Profile profile) {
        return new ProfileResponse(
                profile.getProfileId(),
                profile.getAccount().getAccountId(),
                profile.getFirstName(),
                profile.getLastName(),
                profile.getRole()
        );
    }

    /**
     * Converts a ProfileRequest to a Profile entity.
     * @param request - ProfileRequest containing the profile data.
     * @param account - Account entity.
     * @return Profile entity.
     */
    private Profile toModel(ProfileRequest request, Account account) {
        Profile profile = new Profile();
        profile.setFirstName(request.getFirstName());
        profile.setLastName(request.getLastName());
        profile.setRole(request.getRole());
        profile.setPin(passwordEncoder.encode(request.getPin()));
        profile.setAccount(account);

        return profile;
    }
}
