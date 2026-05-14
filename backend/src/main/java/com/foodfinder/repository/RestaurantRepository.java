package com.foodfinder.repository;

import com.foodfinder.entity.Restaurant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {

    Optional<Restaurant> findBySourceId(String sourceId);

    boolean existsBySourceId(String sourceId);

    @Query("""
        SELECT r FROM Restaurant r
        WHERE (
            :cuisine IS NULL OR LOWER(r.cuisines) LIKE LOWER(CONCAT('%', CAST(:cuisine AS string), '%'))
        )
        AND (
            :dish IS NULL OR LOWER(r.menuItems) LIKE LOWER(CONCAT('%', CAST(:dish AS string), '%'))
            OR LOWER(r.cuisines) LIKE LOWER(CONCAT('%', CAST(:dish AS string), '%'))
            OR LOWER(r.restaurantName) LIKE LOWER(CONCAT('%', CAST(:dish AS string), '%'))
        )
        AND (
            :location IS NULL
            OR LOWER(r.city) LIKE LOWER(CONCAT('%', CAST(:location AS string), '%'))
            OR LOWER(r.locality) LIKE LOWER(CONCAT('%', CAST(:location AS string), '%'))
            OR LOWER(r.address) LIKE LOWER(CONCAT('%', CAST(:location AS string), '%'))
            OR LOWER(r.country) LIKE LOWER(CONCAT('%', CAST(:location AS string), '%'))
        )
    """)
    Page<Restaurant> searchRestaurants(
            @Param("cuisine") String cuisine,
            @Param("dish") String dish,
            @Param("location") String location,
            Pageable pageable
    );

    @Query("""
        SELECT COUNT(r) FROM Restaurant r
        WHERE (
            :cuisine IS NULL OR LOWER(r.cuisines) LIKE LOWER(CONCAT('%', CAST(:cuisine AS string), '%'))
        )
        AND (
            :dish IS NULL OR LOWER(r.menuItems) LIKE LOWER(CONCAT('%', CAST(:dish AS string), '%'))
            OR LOWER(r.cuisines) LIKE LOWER(CONCAT('%', CAST(:dish AS string), '%'))
            OR LOWER(r.restaurantName) LIKE LOWER(CONCAT('%', CAST(:dish AS string), '%'))
        )
        AND (
            :location IS NULL
            OR LOWER(r.city) LIKE LOWER(CONCAT('%', CAST(:location AS string), '%'))
            OR LOWER(r.locality) LIKE LOWER(CONCAT('%', CAST(:location AS string), '%'))
            OR LOWER(r.address) LIKE LOWER(CONCAT('%', CAST(:location AS string), '%'))
            OR LOWER(r.country) LIKE LOWER(CONCAT('%', CAST(:location AS string), '%'))
        )
    """)
    long countSearchResults(
            @Param("cuisine") String cuisine,
            @Param("dish") String dish,
            @Param("location") String location
    );

    @Query("SELECT COUNT(r) FROM Restaurant r")
    long countAll();



    @Query("SELECT r.cuisines FROM Restaurant r WHERE r.cuisines IS NOT NULL AND LOWER(r.cuisines) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%'))")
    java.util.List<String> findCuisinesMatching(@Param("query") String query, Pageable pageable);

    @Query("SELECT r.menuItems FROM Restaurant r WHERE r.menuItems IS NOT NULL AND LOWER(r.menuItems) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%'))")
    java.util.List<String> findMenuItemsMatching(@Param("query") String query, Pageable pageable);
}
