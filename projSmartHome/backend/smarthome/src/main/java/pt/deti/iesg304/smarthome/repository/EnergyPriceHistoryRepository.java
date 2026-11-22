package pt.deti.iesg304.smarthome.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pt.deti.iesg304.smarthome.model.EnergyPriceHistory;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface EnergyPriceHistoryRepository extends JpaRepository<EnergyPriceHistory, Long> {

    /**
     * Returns the price active at a given point in time for a house.
     * Finds the most recent entry with validFrom <= timestamp.
     */
    @Query("""
            SELECT e FROM EnergyPriceHistory e
            WHERE e.house.houseId = :houseId
              AND e.validFrom <= :at
            ORDER BY e.validFrom DESC
            LIMIT 1
            """)
    Optional<EnergyPriceHistory> findPriceAt(
            @Param("houseId") Long houseId,
            @Param("at") LocalDateTime at);

    /**
     * Returns the current active price for a house (most recent entry).
     */
    @Query("""
            SELECT e FROM EnergyPriceHistory e
            WHERE e.house.houseId = :houseId
            ORDER BY e.validFrom DESC
            LIMIT 1
            """)
    Optional<EnergyPriceHistory> findCurrentPrice(@Param("houseId") Long houseId);

    /**
     * Returns all price entries for a house ordered chronologically.
     * Used to display price history to the admin.
     */
    List<EnergyPriceHistory> findByHouse_HouseIdOrderByValidFromDesc(Long houseId);
    
}