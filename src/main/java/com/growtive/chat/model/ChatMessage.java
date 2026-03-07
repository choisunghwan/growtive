package com.growtive.chat.model;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ChatMessage {
    private Long msgId;
    private Long roomId;
    private Long senderId;
    private String content;
    private LocalDateTime createdAt;
}
