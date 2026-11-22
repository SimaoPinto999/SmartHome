package pt.deti.iesg304.smarthome.config;

import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.integration.annotation.MessagingGateway;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.integration.channel.DirectChannel;
import org.springframework.integration.mqtt.core.DefaultMqttPahoClientFactory;
import org.springframework.integration.mqtt.core.MqttPahoClientFactory;
import org.springframework.integration.mqtt.outbound.MqttPahoMessageHandler;
import org.springframework.integration.mqtt.support.MqttHeaders;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.handler.annotation.Header;

@Configuration
public class MqttPublisherConfig {

    @Value("${spring.mqtt.url}")
    private String mqttUrl;

    @Value("${spring.mqtt.username}")
    private String mqttUsername;

    @Value("${spring.mqtt.password}")
    private String mqttPassword;

    @Value("${spring.mqtt.client-id}")
    private String mqttClientId;

    @Bean
    public MqttPahoClientFactory mqttPublisherClientFactory() {
        DefaultMqttPahoClientFactory factory = new DefaultMqttPahoClientFactory();
        MqttConnectOptions options = new MqttConnectOptions();
        options.setServerURIs(new String[]{ mqttUrl });
        options.setUserName(mqttUsername);
        options.setPassword(mqttPassword.toCharArray());
        options.setCleanSession(true);
        options.setAutomaticReconnect(true);
        factory.setConnectionOptions(options);
        return factory;
    }

    @Bean
    public MessageChannel mqttOutboundChannel() {
        return new DirectChannel();
    }

    @Bean
    @ServiceActivator(inputChannel = "mqttOutboundChannel")
    public MqttPahoMessageHandler mqttOutboundHandler() {
        MqttPahoMessageHandler handler = new MqttPahoMessageHandler(
                mqttClientId + "-publisher",
                mqttPublisherClientFactory()
        );
        handler.setAsync(true);
        handler.setDefaultQos(1);
        return handler;
    }

    @MessagingGateway(defaultRequestChannel = "mqttOutboundChannel")
    public interface MqttGateway {
        void publish(@Header(MqttHeaders.TOPIC) String topic, String payload);
    }
}