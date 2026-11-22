package pt.deti.iesg304.smarthome.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pt.deti.iesg304.smarthome.model.RuleAction;

import java.time.LocalDateTime;
import java.util.List;

public interface RuleActionRepository extends JpaRepository<RuleAction, Long> {

    List<RuleAction> findByRule_RuleId(Long ruleId);

    List<RuleAction> findByAutoOffAtLessThanEqual(LocalDateTime threshold);
}
