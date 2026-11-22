package pt.deti.iesg304.smarthome.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pt.deti.iesg304.smarthome.model.ActivityLog;
import org.springframework.data.domain.Page;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    
    @Query("SELECT a FROM ActivityLog a " +
           "LEFT JOIN a.component c " +
           "LEFT JOIN c.device d " +
           "LEFT JOIN d.room r " +
           "WHERE a.house.houseId = :houseId " +
           "AND (:roomId IS NULL OR r.roomId = :roomId) " +
           "AND (:eventType IS NULL OR a.eventType = :eventType) " +
           "AND a.timestamp >= :from " +
           "AND a.timestamp <= :to " +
           "AND (:search = '' OR " +
           "LOWER(a.message) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.componentName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(d.deviceName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(r.roomName) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY a.timestamp DESC")
    Page<ActivityLog> findLogs(@Param("houseId") Long houseId, 
                               @Param("roomId") Long roomId,
                               @Param("eventType") String eventType,
                               @Param("from") LocalDateTime from, 
                               @Param("to") LocalDateTime to, 
                               @Param("search") String search,
                               Pageable pageable);
}
