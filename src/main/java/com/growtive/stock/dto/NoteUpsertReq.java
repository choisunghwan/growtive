package com.growtive.stock.dto;

import lombok.*;
import java.math.BigDecimal;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class NoteUpsertReq {
    private BigDecimal buyPrice;
    private BigDecimal sellPrice;
    private BigDecimal targetPrice;
    private String memo;
}