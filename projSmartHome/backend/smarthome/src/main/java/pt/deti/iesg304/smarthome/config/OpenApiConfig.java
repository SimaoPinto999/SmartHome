package pt.deti.iesg304.smarthome.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;
import io.swagger.v3.oas.annotations.security.OAuthFlow;
import io.swagger.v3.oas.annotations.security.OAuthFlows;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "Smart Home Dashboard API",
                version = "0.3.0",
                description = "REST API for the Smart Home project, secured with Authentik.",
                contact = @Contact(name = "IES G403", url = "https://github.com/detiuaveiro/ies2526-group-project-ies2526_g403"),
                license = @License(name = "Academic Use", url = "https://www.ua.pt/")
        ),
        servers = {
                @Server(url = "http://localhost:8081", description = "Local development")
        },
        security = {
                @SecurityRequirement(name = "authentik")
        }
)
@SecurityScheme(
        name = "authentik",
        type = SecuritySchemeType.OAUTH2,
        flows = @OAuthFlows(
                authorizationCode = @OAuthFlow(
                        authorizationUrl = "http://localhost:9090/application/o/authorize/",
                        tokenUrl = "http://localhost:9090/application/o/token/",
                        scopes = {
                                @io.swagger.v3.oas.annotations.security.OAuthScope(name = "openid", description = "OpenID Token"),
                                @io.swagger.v3.oas.annotations.security.OAuthScope(name = "profile", description = "User profile"),
                                @io.swagger.v3.oas.annotations.security.OAuthScope(name = "email", description = "User email")
                        }
                )
        )
)
public class OpenApiConfig {
}
