package pt.deti.iesg304.smarthome.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pt.deti.iesg304.smarthome.model.RuleCondition;

import java.util.Optional;

public interface RuleConditionRepository extends JpaRepository<RuleCondition, Long> {

    Optional<RuleCondition> findByRule_RuleId(Long ruleId);
}
