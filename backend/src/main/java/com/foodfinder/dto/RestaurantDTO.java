package com.foodfinder.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RestaurantDTO {

    private Long id;
    private String restaurantName;
    private List<String> cuisineList;
    private String cuisines;
    private Double averageRating;
    private Integer ratingCount;
    private Double approximateCost;
    private String currency;
    private String address;
    private String locality;
    private String city;
    private String country;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String menuItems;
    private Boolean hasOnlineDelivery;
    private Boolean hasTableBooking;
    private Integer priceRange;
    private Double distanceKm;
    private Double score;
    private String priceLabel;
    private String ratingLabel;
}
