package com.foodfinder.service;

import com.foodfinder.dto.ApiResponse;
import com.foodfinder.dto.RestaurantDTO;
import com.foodfinder.dto.SearchRequestDTO;
import com.foodfinder.entity.Restaurant;
import com.foodfinder.exception.ResourceNotFoundException;
import com.foodfinder.repository.RestaurantRepository;
import com.foodfinder.utility.HaversineUtil;
import com.foodfinder.utility.RestaurantMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class RestaurantService {

    private final RestaurantRepository restaurantRepository;
    private final RestaurantMapper restaurantMapper;
    private final HaversineUtil haversineUtil;

    public ApiResponse<List<RestaurantDTO>> searchRestaurants(SearchRequestDTO request) {
        String cuisine = nullIfBlank(request.getCuisine());
        String dish = nullIfBlank(request.getDish());
        String location = nullIfBlank(request.getLocation());

        String sortBy = request.getSortBy();
        int page = request.getPage();
        int size = request.getSize();

        log.debug("Search: cuisine={}, dish={}, location={}, sort={}, page={}, size={}",
                cuisine, dish, location, sortBy, page, size);

        // For nearest/best, we need user coords; fetch larger set and sort in memory
        boolean needsInMemorySort = isDistanceSort(sortBy);

        Pageable pageable;
        if (needsInMemorySort) {
            pageable = PageRequest.of(0, 500); // grab larger set for re-sorting
        } else {
            pageable = buildPageable(sortBy, page, size);
        }

        Page<Restaurant> resultPage = restaurantRepository.searchRestaurants(cuisine, dish, location, pageable);

        if (needsInMemorySort) {
            return buildSortedResponse(resultPage.getContent(), request, page, size);
        }

        List<RestaurantDTO> dtos = resultPage.getContent().stream()
                .map(r -> enrichWithDistance(r, request))
                .collect(Collectors.toList());

        return ApiResponse.paginated(
                dtos,
                (int) resultPage.getTotalElements(),
                resultPage.getTotalPages(),
                page,
                size
        );
    }

    public RestaurantDTO getRestaurantById(Long id) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with id: " + id));
        return restaurantMapper.toDTO(restaurant);
    }

    public List<String> getSuggestions(String type, String query) {
        if (query == null || query.trim().length() < 2) {
            return List.of();
        }
        String q = query.trim().toLowerCase();
        List<String> rawResults;
        PageRequest limit = PageRequest.of(0, 20);

        if ("dish".equalsIgnoreCase(type)) {
            rawResults = restaurantRepository.findMenuItemsMatching(q, limit);
        } else if ("cuisine".equalsIgnoreCase(type)) {
            rawResults = restaurantRepository.findCuisinesMatching(q, limit);
        } else {
            return List.of();
        }

        return rawResults.stream()
                .flatMap(s -> Arrays.stream(s.split("[,|/]")))
                .map(String::trim)
                .filter(s -> s.toLowerCase().contains(q))
                .distinct()
                .limit(5)
                .collect(Collectors.toList());
    }

    private ApiResponse<List<RestaurantDTO>> buildSortedResponse(
            List<Restaurant> restaurants, SearchRequestDTO request, int page, int size) {

        Double userLat = request.getUserLatitude();
        Double userLon = request.getUserLongitude();
        String sortBy = request.getSortBy();

        List<RestaurantDTO> dtos = restaurants.stream()
                .map(r -> {
                    double dist = (userLat != null && userLon != null)
                            ? haversineUtil.calculateDistance(r.getLatitude(), r.getLongitude(), userLat, userLon)
                            : Double.MAX_VALUE;
                    RestaurantDTO dto = restaurantMapper.toDTOWithDistance(r, dist);
                    dto.setScore(calculateScore(r, dist));
                    return dto;
                })
                .sorted(buildComparator(sortBy))
                .collect(Collectors.toList());

        int total = dtos.size();
        int totalPages = (int) Math.ceil((double) total / size);
        int fromIndex = page * size;
        int toIndex = Math.min(fromIndex + size, total);

        List<RestaurantDTO> pageSlice = (fromIndex < total)
                ? dtos.subList(fromIndex, toIndex)
                : List.of();

        return ApiResponse.paginated(pageSlice, total, totalPages, page, size);
    }

    private RestaurantDTO enrichWithDistance(Restaurant r, SearchRequestDTO request) {
        Double userLat = request.getUserLatitude();
        Double userLon = request.getUserLongitude();
        if (userLat != null && userLon != null) {
            double dist = haversineUtil.calculateDistance(r.getLatitude(), r.getLongitude(), userLat, userLon);
            return restaurantMapper.toDTOWithDistance(r, dist);
        }
        return restaurantMapper.toDTO(r);
    }

    private Pageable buildPageable(String sortBy, int page, int size) {
        Sort sort = switch (sortBy == null ? "" : sortBy.toLowerCase()) {
            case "cheapest" -> Sort.by(Sort.Direction.ASC, "approximateCost");
            case "rated" -> Sort.by(Sort.Direction.DESC, "averageRating");
            default -> Sort.by(Sort.Direction.DESC, "averageRating");
        };
        return PageRequest.of(page, size, sort);
    }

    private Comparator<RestaurantDTO> buildComparator(String sortBy) {
        return switch (sortBy == null ? "" : sortBy.toLowerCase()) {
            case "nearest" -> Comparator.comparingDouble(dto ->
                    dto.getDistanceKm() != null ? dto.getDistanceKm() : Double.MAX_VALUE);
            case "best" -> Comparator.comparingDouble((RestaurantDTO dto) ->
                    dto.getScore() != null ? dto.getScore() : 0.0).reversed();
            default -> Comparator.comparingDouble((RestaurantDTO dto) ->
                    dto.getDistanceKm() != null ? dto.getDistanceKm() : Double.MAX_VALUE);
        };
    }

    private double calculateScore(Restaurant r, double distanceKm) {
        double ratingScore = 0.0;
        if (r.getAverageRating() != null && r.getAverageRating() > 0) {
            ratingScore = (r.getAverageRating() / 5.0) * 40.0; // max 40 points
        }

        double affordabilityScore = 0.0;
        if (r.getApproximateCost() != null && r.getApproximateCost() > 0) {
            // Lower cost = higher score; normalize by assuming max cost ~5000
            affordabilityScore = Math.max(0, (1.0 - (r.getApproximateCost() / 5000.0)) * 30.0); // max 30 points
        }

        double proximityScore = 0.0;
        if (distanceKm < Double.MAX_VALUE) {
            // Within 1km = max; decreasing up to 50km
            proximityScore = Math.max(0, (1.0 - Math.min(distanceKm / 50.0, 1.0)) * 30.0); // max 30 points
        }

        return ratingScore + affordabilityScore + proximityScore;
    }

    private boolean isDistanceSort(String sortBy) {
        if (sortBy == null) return false;
        return sortBy.equalsIgnoreCase("nearest") || sortBy.equalsIgnoreCase("best");
    }

    private String nullIfBlank(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }
}
