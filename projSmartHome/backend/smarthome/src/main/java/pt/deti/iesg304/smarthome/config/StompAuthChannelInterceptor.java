package pt.deti.iesg304.smarthome.config;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import pt.deti.iesg304.smarthome.model.Account;
import pt.deti.iesg304.smarthome.repository.AccountRepository;
import pt.deti.iesg304.smarthome.repository.HouseRepository;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    private static final Pattern HOUSE_TOPIC = Pattern.compile("^/topic/houses/(\\d+)/");

    private final JwtDecoder jwtDecoder;
    private final AccountRepository accountRepository;
    private final HouseRepository houseRepository;

    public StompAuthChannelInterceptor(JwtDecoder jwtDecoder,
                                       AccountRepository accountRepository,
                                       HouseRepository houseRepository) {
        this.jwtDecoder = jwtDecoder;
        this.accountRepository = accountRepository;
        this.houseRepository = houseRepository;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null) return message;

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            List<String> authHeaders = accessor.getNativeHeader("Authorization");
            if (authHeaders == null || authHeaders.isEmpty()) {
                throw new IllegalArgumentException("Missing Authorization header on CONNECT");
            }
            String bearer = authHeaders.get(0);
            if (!bearer.startsWith("Bearer ")) {
                throw new IllegalArgumentException("Invalid Authorization header");
            }
            Jwt jwt = jwtDecoder.decode(bearer.substring(7));
            AbstractAuthenticationToken auth = new JwtAuthenticationToken(jwt);
            accessor.setUser(auth);
        }

        if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            String destination = accessor.getDestination();
            if (destination == null) return message;

            Matcher m = HOUSE_TOPIC.matcher(destination);
            if (m.find()) {
                Long houseId = Long.parseLong(m.group(1));
                String email = extractEmail(accessor);
                Account account = accountRepository.findByEmail(email)
                        .orElseThrow(() -> new IllegalArgumentException("Account not found"));
                boolean ownsHouse = houseRepository.findByAccount_AccountId(account.getAccountId())
                        .stream().anyMatch(h -> houseId.equals(h.getHouseId()));
                if (!ownsHouse) {
                    throw new IllegalArgumentException("Access denied to house " + houseId);
                }
            }
        }

        return message;
    }

    private String extractEmail(StompHeaderAccessor accessor) {
        if (accessor.getUser() instanceof JwtAuthenticationToken jwtAuth) {
            Jwt jwt = (Jwt) jwtAuth.getCredentials();
            return JwtUtils.extractEmail(jwt);
        }
        throw new IllegalArgumentException("Not authenticated");
    }
}