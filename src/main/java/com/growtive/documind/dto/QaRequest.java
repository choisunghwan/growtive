package com.growtive.documind.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * 📨 QaRequest
 * - 클라이언트(프론트엔드)에서 /api/docs/{id}/ask 호출 시 전달하는 요청 바디
 * - 질문 내용만 담음
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class QaRequest {

    /** 사용자가 입력한 질문 */
    @NotBlank(message = "질문 내용은 필수입니다.")
    private String question;
}
