package com.growtive.documind.dto;

import com.growtive.documind.model.QaLog;
import lombok.*;

/**
 * 💬 QaLogDto
 * - 특정 문서에 대해 사용자가 질문한 Q&A 로그 정보 전달용
 * - 질문 내용과 OpenAI가 생성한 답변을 함께 보냄
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QaLogDto {

    /** Q&A 로그 ID */
    private Long id;

    /** 문서 ID */
    private Long documentId;

    /** 사용자가 입력한 질문 */
    private String question;

    /** AI(OpenAI)로부터 받은 답변 */
    private String answer;

    /** 생성 시간 */
    private java.time.LocalDateTime createdAt;

    /** 엔티티 → DTO 변환 */
    public static QaLogDto fromEntity(QaLog q) {
        return QaLogDto.builder()
                .id(q.getId())
                .documentId(q.getDocumentId())
                .question(q.getQuestion())
                .answer(q.getAnswer())
                .createdAt(q.getCreatedAt())
                .build();
    }
}
