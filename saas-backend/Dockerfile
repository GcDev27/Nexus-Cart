# ── 1. Build com o Gradle Wrapper do projeto ───────────────────
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
COPY gradlew settings.gradle build.gradle ./
COPY gradle ./gradle
RUN chmod +x gradlew && ./gradlew --no-daemon dependencies > /dev/null
COPY src ./src
RUN ./gradlew --no-daemon bootJar -x test

# ── 2. Execução ─────────────────────────────────────────────────
FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd --system --create-home app
COPY --from=build /app/build/libs/*.jar app.jar
USER app
EXPOSE 8081
# Obrigatórias em produção: DB_URL, DB_USERNAME, DB_PASSWORD, JWT_SECRET, ENCRYPTION_KEY, CORS_ALLOWED_ORIGINS
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
