package pt.deti.iesg304.smarthome.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pt.deti.iesg304.smarthome.model.AutomationRule;

import java.util.List;
import java.util.Optional;

public interface AutomationRuleRepository extends JpaRepository<AutomationRule, Long> {

    List<AutomationRule> findByHouse_HouseId(Long houseId);

    List<AutomationRule> findBySensorComponent_ComponentIdAndEnabledTrue(Long componentId);

    Optional<AutomationRule> findByHouse_HouseIdAndName(Long houseId, String name);
}
