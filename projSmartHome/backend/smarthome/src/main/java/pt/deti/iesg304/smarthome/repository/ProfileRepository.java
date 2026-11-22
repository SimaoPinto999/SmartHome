package pt.deti.iesg304.smarthome.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import pt.deti.iesg304.smarthome.model.Profile;

@Repository
public interface ProfileRepository extends JpaRepository<Profile, Long> {

    List<Profile> findByAccount_AccountId(Long accountId);

    List<Profile> findByAccount_Email(String email);

    List<Profile> findByFirstName(String firstName);

    List<Profile> findByRole(String role);

}
