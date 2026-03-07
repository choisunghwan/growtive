package com.growtive.auth.controller;

import com.growtive.auth.service.AuthService;

import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * 작성자: 최성환
     * @param token
     * @return
     */
    @GetMapping("/verify")
    public AuthService.VerifyResult verify(@RequestParam String token) {
        return authService.verifyMagicLink(token);
    }


    /**
     * 작성자: 최성환
     * 세션에 LOGIN_USER 저장
     * @param body
     * @param session
     */
    @PostMapping("/login")
    public void login(
            @RequestBody Map<String, String> body,
            HttpSession session
    ) {
        String userId = body.get("userId");

        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("userId required");
        }

        // TODO: 나중에 DB 사용자 존재 여부 체크
        session.setAttribute("userId", userId);
    }

    /**
     * 작성자: 최성환
     * 현재 로그인 유저 조회
     * @param session
     * @return
     */
    @GetMapping("/me")
    public Map<String, String> me(HttpSession session) {
        String userId = (String) session.getAttribute("userId");
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        return Map.of("userId", userId);
    }

    @PostMapping("/logout")
    public void logout(HttpSession session) {
        session.invalidate(); // 🔥 세션 완전 삭제
    }
}
