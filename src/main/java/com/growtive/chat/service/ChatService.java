package com.growtive.chat.service;

import com.growtive.chat.mapper.ChatMessageMapper;
import com.growtive.chat.model.ChatMessage;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ChatService {

    private final ChatMessageMapper chatMessageMapper;

    public ChatService(ChatMessageMapper chatMessageMapper) {
        this.chatMessageMapper = chatMessageMapper;
    }

    public List<ChatMessage> getMessages(Long roomId) {
        return chatMessageMapper.selectMessagesByRoom(roomId);
    }

    public ChatMessage sendMessage(Long roomId, String userId, String content) {
        ChatMessage message = new ChatMessage();
        message.setRoomId(roomId);
        message.setSenderId(userId);
        message.setContent(content);

        chatMessageMapper.insertMessage(message);
        return message;
    }
}
