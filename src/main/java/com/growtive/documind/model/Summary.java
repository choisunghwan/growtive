package com.growtive.documind.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Summary {
    private Long id;
    private Long documentId;
    private String summaryText;
    private java.time.LocalDateTime createdAt;
}
