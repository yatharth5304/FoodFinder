package com.foodfinder.utility;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class HaversineUtil {

    private static final double EARTH_RADIUS_KM = 6371.0;

    /**
     * Calculates the great-circle distance between two points
     * on Earth using the Haversine formula.
     *
     * @param lat1 Latitude of point 1 in decimal degrees
     * @param lon1 Longitude of point 1 in decimal degrees
     * @param lat2 Latitude of point 2 in decimal degrees
     * @param lon2 Longitude of point 2 in decimal degrees
     * @return Distance in kilometers
     */
    public double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return EARTH_RADIUS_KM * c;
    }

    /**
     * Calculates distance using BigDecimal coordinates (for entity fields).
     */
    public double calculateDistance(BigDecimal lat1, BigDecimal lon1, double lat2, double lon2) {
        if (lat1 == null || lon1 == null) {
            return Double.MAX_VALUE;
        }
        return calculateDistance(lat1.doubleValue(), lon1.doubleValue(), lat2, lon2);
    }

    /**
     * Formats distance for display.
     */
    public String formatDistance(double distanceKm) {
        if (distanceKm == Double.MAX_VALUE) {
            return "N/A";
        }
        if (distanceKm < 1.0) {
            return String.format("%.0f m", distanceKm * 1000);
        }
        return String.format("%.1f km", distanceKm);
    }
}
