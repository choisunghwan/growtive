package com.growtive.chat.dto;
/**
 * 메시지 전송 요청 DTO
 */
import lombok.Data;

@Data
public class SendMessageRequest {
    private Long senderId;
    private String content;
}