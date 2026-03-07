package com.growtive.stock.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class StockDetailRes {
    private Long id;
    private String symbol;
    private String market;
    private String name;

    // 내 노트(가장 최근 1건)
    private Long noteId;
    private BigDecimal buyPrice;
    private BigDecimal sellPrice;
    private BigDecimal targetPrice;
    private String memo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}