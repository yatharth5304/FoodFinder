#!/bin/bash
# ============================================================
# FoodFinder Build Script
# Builds the Spring Boot fat JAR for deployment.
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"

echo "🍽  FoodFinder Build Starting..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Build Maven project
echo "🔨 Building Maven project..."
cd "$BACKEND_DIR"
mvn clean package -DskipTests -q
echo "   ✓ JAR built: $(ls target/foodfinder-*.jar)"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Build complete!"
echo ""
echo "To run locally:"
echo "   DATABASE_URL=jdbc:postgresql://... DATABASE_USERNAME=postgres DATABASE_PASSWORD=... java -jar backend/target/foodfinder-*.jar"
