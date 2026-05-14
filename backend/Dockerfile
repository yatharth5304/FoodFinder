# ============================================================
# FoodFinder — Multi-stage Production Dockerfile
# Stage 1: Maven build
# Stage 2: Lightweight JRE runtime
# ============================================================

# ── Stage 1: Build ──────────────────────────────────────────
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder

WORKDIR /build

# Copy pom.xml first for layer caching
COPY pom.xml .

# Download dependencies (cached unless pom.xml changes)
RUN mvn dependency:go-offline -q

# Copy source code
COPY src ./src

# Build fat JAR, skip tests for faster Docker builds
RUN mvn package -DskipTests -q

# ── Stage 2: Runtime ────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine AS runtime

# Create non-root user for security
RUN addgroup -S foodfinder && adduser -S foodfinder -G foodfinder

WORKDIR /app

# Copy JAR from build stage
COPY --from=builder /build/target/foodfinder-*.jar app.jar

# Change ownership
RUN chown -R foodfinder:foodfinder /app

USER foodfinder

# Expose port (Render uses PORT env var)
EXPOSE 8080

# JVM tuning for container environments
ENV JAVA_OPTS="-XX:+UseContainerSupport \
               -XX:MaxRAMPercentage=75.0 \
               -XX:+UseG1GC \
               -Djava.security.egd=file:/dev/./urandom \
               -Dspring.backgroundpreinitializer.ignore=true"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
