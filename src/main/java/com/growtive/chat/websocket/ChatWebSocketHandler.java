package com.growtive.chat.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 💬 ChatWebSocketHandler
 *
 * 역할 정리
 * -------------------------------------------------
 * 1️⃣ WebSocket 연결 / 해제 관리
 * 2️⃣ 접속자(userId) 실시간 추적
 * 3️⃣ 온라인 사용자 목록 브로드캐스트
 * 4️⃣ 채팅 메시지 브로드캐스트
 *
 * ※ 메시지 "저장"은 REST에서 처리
 * ※ WebSocket은 "실시간 전달" 전용
 */
@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    /**
     * 🔌 현재 연결된 모든 WebSocket 세션
     */
    private static final Set<WebSocketSession> sessions =
            ConcurrentHashMap.newKeySet();

    /**
     * 👤 현재 접속 중인 사용자 목록
     * - key: userId
     * - value: WebSocketSession
     *
     * ※ 중복 로그인 허용 구조
     */
    private static final Map<WebSocketSession, String> sessionUserMap =
            new ConcurrentHashMap<>();

    private final ObjectMapper objectMapper = new ObjectMapper();

    /* =====================================================
       1️⃣ WebSocket 연결 시
       ===================================================== */
    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        sessions.add(session);

        // 🔑 URL Query (?userId=xxx) 에서 userId 추출
        String userId = extractUserId(session);

        if (userId != null) {
            sessionUserMap.put(session, userId);

            // 🔔 접속자 목록 변경 → 전체 브로드캐스트
            broadcastOnlineUsers();
        }
    }

    /* =====================================================
       2️⃣ 메시지 수신
       - 클라이언트가 보내는 실시간 알림용
       ===================================================== */
    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message)
            throws Exception {

        // 받은 메시지를 그대로 모든 세션에 브로드캐스트
        for (WebSocketSession s : sessions) {
            if (s.isOpen()) {
                s.sendMessage(message);
            }
        }
    }

    /* =====================================================
       3️⃣ WebSocket 연결 종료 시
       ===================================================== */
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status)
            throws Exception {

        sessions.remove(session);

        // 사용자 제거
        sessionUserMap.remove(session);

        // 🔔 접속자 목록 변경 → 전체 브로드캐스트
        broadcastOnlineUsers();
    }

    /* =====================================================
       📡 온라인 사용자 목록 브로드캐스트
       ===================================================== */
    private void broadcastOnlineUsers() throws Exception {

        Set<String> onlineUsers = ConcurrentHashMap.newKeySet();
        onlineUsers.addAll(sessionUserMap.values());

        Map<String, Object> payload = Map.of(
                "type", "ONLINE_USERS",
                "users", onlineUsers
        );

        String json = objectMapper.writeValueAsString(payload);

        for (WebSocketSession s : sessions) {
            if (s.isOpen()) {
                s.sendMessage(new TextMessage(json));
            }
        }
    }

    /* =====================================================
       🔍 userId 추출
       예) ws://localhost:8080/ws/chat?userId=sunghwan
       ===================================================== */
    private String extractUserId(WebSocketSession session) {
        if (session.getUri() == null) return null;

        String query = session.getUri().getQuery();
        if (query == null) return null;

        for (String param : query.split("&")) {
            if (param.startsWith("userId=")) {
                return param.substring("userId=".length());
            }
        }
        return null;
    }
}
