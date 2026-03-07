package com.growtive.auth.controller;

import com.growtive.auth.dto.LoginRequestDto;
import com.growtive.auth.service.AuthService;

import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import com.growtive.auth.dto.RegisterRequestDto;


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
//    @GetMapping("/verify")
//    public AuthService.VerifyResult verify(@RequestParam String token) {
//        return authService.verifyMagicLink(token);
//    }


    /**
     * 작성자: 최성환
     * 세션에 LOGIN_USER 저장
     * @param body
     * @param session
     */
    @PostMapping("/login")
    public void login(
            @RequestBody LoginRequestDto request,
            HttpSession session
    ) {

        Long userId = authService.login(
                request.getUsername(),
                request.getPassword()
        );

        session.setAttribute("userId", userId);
    }

    /**
     * 작성자: 최성환
     * 현재 로그인 유저 조회
     * @param session
     * @return
     */
    @GetMapping("/me")
    public Map<String, Long> me(HttpSession session) {

        Long userId = (Long) session.getAttribute("userId");  // ✅

        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }

        return Map.of("userId", userId);
    }
    @PostMapping("/logout")
    public void logout(HttpSession session) {
        session.invalidate(); // 🔥 세션 완전 삭제
    }

    @PostMapping("/register")
    public void register(@RequestBody RegisterRequestDto request) {

        authService.register(
                request.getUsername(),
                request.getPassword(),
                request.getDisplayName(),
                request.getEmail()
        );

    }
}
