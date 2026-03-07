package com.growtive.chat.dto;
/**
 * 메시지 전송 요청 DTO
 */
import lombok.Data;

@Data
public class SendMessageRequest {
    private String senderId;
    private String content;
}