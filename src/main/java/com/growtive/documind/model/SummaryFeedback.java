package com.growtive.documind.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SummaryFeedback {
    private Long id;
    private Long summaryId;
    private String editor;
    private String feedbackText;
    private java.time.LocalDateTime createdAt;
}
