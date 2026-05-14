package com.foodfinder.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "restaurants", indexes = {
    @Index(name = "idx_restaurant_city", columnList = "city"),
    @Index(name = "idx_restaurant_cuisines", columnList = "cuisines"),
    @Index(name = "idx_restaurant_rating", columnList = "average_rating"),
    @Index(name = "idx_restaurant_cost", columnList = "approximate_cost"),
    @Index(name = "idx_restaurant_source_id", columnList = "source_id", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Restaurant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "source_id", unique = true, length = 255)
    private String sourceId;

    @Column(name = "restaurant_name", nullable = false, length = 500)
    private String restaurantName;

    @Column(name = "cuisines", length = 500)
    private String cuisines;

    @Column(name = "average_rating")
    private Double averageRating;

    @Column(name = "rating_count")
    private Integer ratingCount;

    @Column(name = "approximate_cost")
    private Double approximateCost;

    @Column(name = "currency", length = 50)
    private String currency;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Column(name = "locality", length = 500)
    private String locality;

    @Column(name = "city", length = 255)
    private String city;

    @Column(name = "country", length = 255)
    private String country;

    @Column(name = "latitude", precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(name = "longitude", precision = 10, scale = 7)
    private BigDecimal longitude;

    @Column(name = "menu_items", columnDefinition = "TEXT")
    private String menuItems;

    @Column(name = "has_online_delivery")
    private Boolean hasOnlineDelivery;

    @Column(name = "has_table_booking")
    private Boolean hasTableBooking;

    @Column(name = "price_range")
    private Integer priceRange;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
