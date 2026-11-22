package pt.deti.iesg304.smarthome.service;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class RealtimePublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public RealtimePublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void publishSensorReading(Long houseId, Object payload) {
        messagingTemplate.convertAndSend("/topic/houses/" + houseId + "/sensors", payload);
    }

    public void publishAlert(Long houseId, Object payload) {
        messagingTemplate.convertAndSend("/topic/houses/" + houseId + "/alerts", payload);
    }
}
