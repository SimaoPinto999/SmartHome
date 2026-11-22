package pt.deti.iesg304.smarthome.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Service
public class WeatherService {

    private static final Logger log = LoggerFactory.getLogger(WeatherService.class);
    private static final String URL =
        "https://api.open-meteo.com/v1/forecast?latitude=38.7169&longitude=-9.1399" +
        "&current=temperature_2m&daily=sunset,sunrise&timezone=Europe%2FLisbon";
    private static final long TEMP_CACHE_SECONDS = 600;
    private static final long SUN_CACHE_SECONDS  = 86400;

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper mapper = new ObjectMapper();

    private double cachedTemp = 20.0;
    private Instant tempCacheUntil = Instant.EPOCH;

    private LocalTime cachedSunset  = LocalTime.of(20, 0);
    private LocalTime cachedSunrise = LocalTime.of(7, 0);
    private Instant sunCacheUntil = Instant.EPOCH;

    public double getValue(String source) {
        if (!"WEATHER_TEMP".equals(source)) {
            throw new IllegalArgumentException("Unknown external source: " + source);
        }
        if (Instant.now().isAfter(tempCacheUntil)) refresh();
        return cachedTemp;
    }

    public LocalTime getSunset() {
        if (Instant.now().isAfter(sunCacheUntil)) refresh();
        return cachedSunset;
    }

    public LocalTime getSunrise() {
        if (Instant.now().isAfter(sunCacheUntil)) refresh();
        return cachedSunrise;
    }

    private synchronized void refresh() {
        try {
            HttpRequest request = HttpRequest.newBuilder().uri(URI.create(URL)).build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode root = mapper.readTree(response.body());

            cachedTemp = root.path("current").path("temperature_2m").asDouble(20.0);
            tempCacheUntil = Instant.now().plusSeconds(TEMP_CACHE_SECONDS);

            JsonNode daily = root.path("daily");
            String sunsetStr  = daily.path("sunset").path(0).asText(null);
            String sunriseStr = daily.path("sunrise").path(0).asText(null);
            if (sunsetStr != null)  cachedSunset  = LocalDateTime.parse(sunsetStr).toLocalTime();
            if (sunriseStr != null) cachedSunrise = LocalDateTime.parse(sunriseStr).toLocalTime();
            sunCacheUntil = Instant.now().plusSeconds(SUN_CACHE_SECONDS);

            log.info("Weather refreshed: {}°C, sunset={}, sunrise={}", cachedTemp, cachedSunset, cachedSunrise);
        } catch (Exception e) {
            log.warn("Weather API unavailable: {}", e.getMessage());
            tempCacheUntil = Instant.now().plusSeconds(60);
            sunCacheUntil  = Instant.now().plusSeconds(60);
        }
    }
}