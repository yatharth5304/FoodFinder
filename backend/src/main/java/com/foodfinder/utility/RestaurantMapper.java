package com.foodfinder.utility;

import com.foodfinder.dto.RestaurantDTO;
import com.foodfinder.entity.Restaurant;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class RestaurantMapper {

    public RestaurantDTO toDTO(Restaurant restaurant) {
        if (restaurant == null) return null;

        RestaurantDTO dto = RestaurantDTO.builder()
                .id(restaurant.getId())
                .restaurantName(restaurant.getRestaurantName())
                .cuisines(restaurant.getCuisines())
                .cuisineList(parseCuisines(restaurant.getCuisines()))
                .averageRating(restaurant.getAverageRating())
                .ratingCount(restaurant.getRatingCount())
                .approximateCost(restaurant.getApproximateCost())
                .currency(restaurant.getCurrency())
                .address(restaurant.getAddress())
                .locality(restaurant.getLocality())
                .city(restaurant.getCity())
                .country(restaurant.getCountry())
                .latitude(restaurant.getLatitude())
                .longitude(restaurant.getLongitude())
                .menuItems(restaurant.getMenuItems())
                .hasOnlineDelivery(restaurant.getHasOnlineDelivery())
                .hasTableBooking(restaurant.getHasTableBooking())
                .priceRange(restaurant.getPriceRange())
                .priceLabel(formatPriceLabel(restaurant.getApproximateCost(), restaurant.getCurrency()))
                .ratingLabel(formatRatingLabel(restaurant.getAverageRating()))
                .build();

        return dto;
    }

    public RestaurantDTO toDTOWithDistance(Restaurant restaurant, double distanceKm) {
        RestaurantDTO dto = toDTO(restaurant);
        if (dto != null) {
            dto.setDistanceKm(distanceKm == Double.MAX_VALUE ? null : Math.round(distanceKm * 10.0) / 10.0);
        }
        return dto;
    }

    private List<String> parseCuisines(String cuisines) {
        if (cuisines == null || cuisines.isBlank()) {
            return Collections.emptyList();
        }
        return Arrays.stream(cuisines.split("[,/|]"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    private String formatPriceLabel(Double cost, String currency) {
        if (cost == null) return "Price N/A";
        String sym = (currency != null && !currency.trim().isEmpty()) ? currency : "Rs. ";
        return sym + String.format("%.0f", cost);
    }

    private String formatRatingLabel(Double rating) {
        if (rating == null || rating <= 0) return "Not Rated";
        return String.format("%.1f", rating);
    }
}
