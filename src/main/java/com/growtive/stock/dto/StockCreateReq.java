package com.growtive.stock.dto;

import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class StockCreateReq {
    private String symbol; // 필수
    private String market; // "US" or "KR"
    private String name;   // 종목명
}