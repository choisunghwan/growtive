package com.growtive.chat.mapper;

import com.growtive.chat.model.ChatMessage;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ChatMessageMapper {

    List<ChatMessage> selectMessagesByRoom(@Param("roomId") Long roomId);

    int insertMessage(ChatMessage message);
}
