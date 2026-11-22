package pt.deti.iesg304.smarthome.config;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

/**
 * Utility class for JWT operations.
 */
@Component
public class JwtUtils {

    /**
     * Extracts the email from a JWT token.
     * @param jwt - JWT token.
     * @return Email extracted from the JWT token.
     */
    public static String extractEmail(Jwt jwt) {
        String email = jwt.getClaimAsString("email");
        if (email != null && !email.isBlank()) return email;
        String preferredUsername = jwt.getClaimAsString("preferred_username");
        if (preferredUsername != null && !preferredUsername.isBlank()) return preferredUsername;
        return jwt.getClaimAsString("sub");
    }
}