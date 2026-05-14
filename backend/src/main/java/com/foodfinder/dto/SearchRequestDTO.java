package com.foodfinder.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SearchRequestDTO {

    private String cuisine;
    private String dish;
    private String location;
    private Double userLatitude;
    private Double userLongitude;
    private String sortBy;       // cheapest, rated, nearest, best
    private int page;
    private int size;

    public int getPage() {
        return page <= 0 ? 0 : page;
    }

    public int getSize() {
        if (size <= 0) return 20;
        if (size > 100) return 100;
        return size;
    }
}
