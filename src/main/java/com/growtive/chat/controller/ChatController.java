package com.growtive.chat.controller;

import com.growtive.chat.dto.SendMessageRequest;
import com.growtive.chat.model.ChatMessage;
import com.growtive.chat.service.ChatService;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }
    // ✅ 1) 메시지 목록 조회 (GET)
    @GetMapping("/rooms/{roomId}/messages")
    public List<ChatMessage> getMessages(@PathVariable Long roomId) {
        return chatService.getMessages(roomId);
    }

    // ✅ 2) 메시지 전송 (POST)
    @PostMapping("/rooms/{roomId}/messages")
    public ChatMessage sendMessage(
            @PathVariable Long roomId,
            @RequestBody SendMessageRequest request   // 🔥 여기 포인트
    ) {
        return chatService.sendMessage(
                roomId,
                request.getSenderId(),
                request.getContent()
        );
    }
}
