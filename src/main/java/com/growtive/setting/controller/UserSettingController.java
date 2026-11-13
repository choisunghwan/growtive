package com.growtive.setting.controller;

import com.growtive.common.exception.UnauthorizedException;
import com.growtive.setting.dto.HistoryPinDto;
import com.growtive.setting.service.UserSettingService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 사용자 설정 API (기기가 달라도 같은 설정이 적용되도록 DB에 저장)
 */
@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class UserSettingController {

    private final UserSettingService service;

    private Long getUserId(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new UnauthorizedException("로그인이 필요합니다.");
        return userId;
    }

    /** 내역 기본 기간 핀 조회 (없으면 204) */
    @GetMapping("/history-pin")
    public ResponseEntity<HistoryPinDto> getHistoryPin(HttpSession session) {
        HistoryPinDto pin = service.getHistoryPin(getUserId(session));
        return pin == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(pin);
    }

    @PutMapping("/history-pin")
    public HistoryPinDto saveHistoryPin(@RequestBody HistoryPinDto pin, HttpSession session) {
        return service.saveHistoryPin(getUserId(session), pin);
    }

    @DeleteMapping("/history-pin")
    public void clearHistoryPin(HttpSession session) {
        service.clearHistoryPin(getUserId(session));
    }
}
