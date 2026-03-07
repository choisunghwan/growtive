package com.growtive.documind.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QaLog {
    private Long id;
    private Long documentId;
    private String question;
    private String answer;
    private java.time.LocalDateTime createdAt;
}