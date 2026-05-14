package com.foodfinder.controller;

import com.foodfinder.dto.ApiResponse;
import com.foodfinder.dto.RestaurantDTO;
import com.foodfinder.dto.SearchRequestDTO;
import com.foodfinder.service.RestaurantService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/restaurants")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class RestaurantController {

    private final RestaurantService restaurantService;

    /**
     * Search restaurants with optional filters and sorting.
     *
     * GET
     * /api/restaurants/search?cuisine=italian&dish=pizza&location=NYC&sortBy=rated&page=0&size=20
     * GET /api/restaurants/search?sortBy=nearest&userLat=40.7&userLon=-74.0
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<RestaurantDTO>>> search(
            @RequestParam(required = false) String cuisine,
            @RequestParam(required = false) String dish,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Double userLat,
            @RequestParam(required = false) Double userLon,
            @RequestParam(required = false, defaultValue = "rated") String sortBy,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size) {
        SearchRequestDTO request = SearchRequestDTO.builder()
                .cuisine(cuisine)
                .dish(dish)
                .location(location)
                .userLatitude(userLat)
                .userLongitude(userLon)
                .sortBy(sortBy)
                .page(page)
                .size(size)
                .build();

        ApiResponse<List<RestaurantDTO>> response = restaurantService.searchRestaurants(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Get a single restaurant by ID.
     *
     * GET /api/restaurants/42
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RestaurantDTO>> getById(@PathVariable Long id) {
        RestaurantDTO dto = restaurantService.getRestaurantById(id);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    /**
     * Get autocomplete suggestions.
     *
     * GET /api/restaurants/suggestions?type=dish&query=bir
     */
    @GetMapping("/suggestions")
    public ResponseEntity<ApiResponse<List<String>>> getSuggestions(
            @RequestParam String type,
            @RequestParam String query) {
        List<String> suggestions = restaurantService.getSuggestions(type, query);
        return ResponseEntity.ok(ApiResponse.success(suggestions));
    }

    /**
     * Health check endpoint.
     */
    @GetMapping("/health")
    public ResponseEntity<ApiResponse<String>> health() {
        return ResponseEntity.ok(ApiResponse.success("FoodFinder API is running"));
    }
}
