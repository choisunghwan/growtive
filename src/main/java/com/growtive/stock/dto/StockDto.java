package com.growtive.stock.dto;

import lombok.*;
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class StockDto {
    private Long id;
    private String symbol; // AAPL, TSLA, 005930
    private String market; // US or KR
    private String name;   // 종목명
}