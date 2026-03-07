package com.growtive.stock.model;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class StockNote {
    private Long id;
    private Long stockId;
    private BigDecimal buyPrice;
    private BigDecimal sellPrice;
    private BigDecimal targetPrice;
    private String memo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}