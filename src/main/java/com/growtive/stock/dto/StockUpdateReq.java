package com.growtive.stock.dto;


import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class StockUpdateReq {
    private String name; // 필요 시 확장
}