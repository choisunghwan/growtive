package com.growtive.chat.websocket;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * ✅ 현재 WebSocket 접속 중인 사용자 목록
 * - 서버 메모리 기반
 * - 실시간 접속자 관리용
 */
public class OnlineUserStore {

    // thread-safe Set
    private static final Set<Long> ONLINE_USERS =
            ConcurrentHashMap.newKeySet();

    public static void add(Long userId) {
        ONLINE_USERS.add(userId);
    }

    public static void remove(Long userId) {
        ONLINE_USERS.remove(userId);
    }

    public static Set<Long> getAll() {
        return ONLINE_USERS;
    }
}