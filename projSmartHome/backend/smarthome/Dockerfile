# Stage 1: Build the application using a Maven image
FROM maven:3.9.6-eclipse-temurin-21 AS builder
WORKDIR /app

# Copy the pom.xml and download dependencies (caches them for faster subsequent builds)
COPY pom.xml .
#COPY .mvn .mvn
#COPY mvnw .
#RUN chmod +x ./mvnw
#RUN ./mvnw dependency:go-offline -B
RUN mvn dependency:go-offline -B

# Copy the source code and build the application
COPY src ./src
#RUN ./mvnw clean package -DskipTests
RUN mvn clean package -DskipTests


# Stage 2: Create the final lightweight runtime image
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy the built jar file from the builder stage
COPY --from=builder /app/target/*.jar app.jar

# Expose the port the app runs on
EXPOSE 8081

# Command to run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
