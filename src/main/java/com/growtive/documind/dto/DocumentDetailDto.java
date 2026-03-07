package com.growtive.documind.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DocumentDetailDto {
    private Long id; private String title; private String content;
    private java.util.List<SummaryDto> summaries;
    private java.util.List<QaLogDto> qaLogs;
}

