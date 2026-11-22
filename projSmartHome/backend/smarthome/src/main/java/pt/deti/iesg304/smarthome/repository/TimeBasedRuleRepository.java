package pt.deti.iesg304.smarthome.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import pt.deti.iesg304.smarthome.model.TimeBasedRule;

import java.util.List;

public interface TimeBasedRuleRepository extends JpaRepository<TimeBasedRule, Long> {
    List<TimeBasedRule> findByHouse_HouseId(Long houseId);

    @EntityGraph(attributePaths = {"targetComponent", "house"})
    List<TimeBasedRule> findByEnabledTrue();
}