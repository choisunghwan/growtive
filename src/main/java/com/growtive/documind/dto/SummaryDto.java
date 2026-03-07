package com.growtive.documind.dto;

import com.growtive.documind.model.Summary;
import lombok.*;

/**
 * 📘 SummaryDto
 * - summary 테이블 데이터를 프론트로 전달하기 위한 DTO
 * - 엔티티(Summary)에서 필요한 데이터만 추출해서 보냄
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SummaryDto {

    /** 요약 ID (PK) */
    private Long id;

    /** 소속 문서 ID (FK → document.id) */
    private Long documentId;

    /** 요약된 텍스트 내용 */
    private String summaryText;

    /** 생성 시각 */
    private java.time.LocalDateTime createdAt;

    /**
     * 엔티티 → DTO 변환
     *  (Service 계층에서 바로 변환 가능하게 유틸리티 메서드 제공)
     */
    public static SummaryDto fromEntity(Summary s) {
        return SummaryDto.builder()
                .id(s.getId())
                .documentId(s.getDocumentId())
                .summaryText(s.getSummaryText())
                .createdAt(s.getCreatedAt())
                .build();
    }
}
