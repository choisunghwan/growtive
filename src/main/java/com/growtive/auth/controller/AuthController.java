package com.growtive.auth.controller;

import com.growtive.auth.dto.LoginRequestDto;
import com.growtive.auth.dto.UserResponseDto;
import com.growtive.auth.dto.WorkScheduleDto;
import com.growtive.auth.service.AuthService;
import com.growtive.common.exception.UnauthorizedException;

import com.growtive.user.model.User;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.*;
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
     * 세션에 LOGIN_USER 저장
     * @param LoginRequestDto
     * @param session
     */
    @PostMapping("/login")
    public UserResponseDto login(
            @RequestBody LoginRequestDto request,
            HttpSession session,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {

        User user = authService.login(
                request.getUsername(),
                request.getPassword()
        );

        session.setAttribute("userId", user.getId());
        session.setAttribute("username", user.getUsername());
        session.setAttribute("displayName", user.getDisplayName());
        session.setAttribute("nickname", user.getNickname());
        session.setAttribute("role", user.getRole());
        session.setAttribute("provider", user.getProvider());

        // 🔒 로그인 유지: 체크 시 세션 쿠키를 브라우저 종료 후에도 30일간 유지되게 함
        if (request.isRememberMe()) {
            int thirtyDaysInSeconds = 60 * 60 * 24 * 30;
            session.setMaxInactiveInterval(thirtyDaysInSeconds);

            Cookie cookie = new Cookie("JSESSIONID", session.getId());
            cookie.setPath("/");
            cookie.setHttpOnly(true);
            cookie.setSecure(httpRequest.isSecure());
            cookie.setMaxAge(thirtyDaysInSeconds);
            httpResponse.addCookie(cookie);
        }

        // 로그인 응답에 유저 정보를 바로 담아서, 프론트가 이어서 /api/auth/me를
        // 또 호출하지 않고 바로 화면을 그릴 수 있게 한다 (왕복 한 번 절약)
        return new UserResponseDto(
                user.getId(),
                user.getUsername(),
                user.getDisplayName(),
                user.getRole(),
                user.getProvider(),
                user.getNickname()
        );
    }

    /**
     * 작성자: 최성환
     * 현재 로그인 유저 조회
     * @param session
     * @return
     */
    @GetMapping("/me")
    public UserResponseDto me(HttpSession session) {

        Long userId = (Long) session.getAttribute("userId");
        String username = (String) session.getAttribute("username");
        String displayName = (String) session.getAttribute("displayName");
        String role = (String) session.getAttribute("role");
        String provider = (String) session.getAttribute("provider");
        String nickname = (String) session.getAttribute("nickname");

        if (userId == null) {
            throw new UnauthorizedException("로그인이 필요합니다.");
        }

        return new UserResponseDto(
                userId,
                username,
                displayName,
                role,
                provider,
                nickname
        );
    }

    /**
     * 이미 로그인한 계정에 카카오 계정을 연결.
     * 세션에 연결 대상 userId를 남겨두고 카카오 인가 화면으로 보낸 뒤,
     * OAuth2LoginSuccessHandler에서 이 값을 보고 로그인이 아니라 "연결"로 처리한다.
     */
    @GetMapping("/link/kakao")
    public void linkKakao(HttpSession session, HttpServletResponse response) throws java.io.IOException {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            response.sendRedirect("/#/login");
            return;
        }
        session.setAttribute("oauth2LinkUserId", userId);
        response.sendRedirect("/oauth2/authorization/kakao");
    }

    /**
     * 실시간 급여 카운터에 쓰이는 근무 스케줄 조회/저장
     */
    @GetMapping("/work-schedule")
    public WorkScheduleDto getWorkSchedule(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new UnauthorizedException("로그인이 필요합니다.");

        User user = authService.getUserById(userId);
        WorkScheduleDto dto = new WorkScheduleDto();
        dto.setWorkStartTime(user.getWorkStartTime());
        dto.setWorkEndTime(user.getWorkEndTime());
        dto.setWorkDays(user.getWorkDays());
        return dto;
    }

    @PutMapping("/work-schedule")
    public void updateWorkSchedule(@RequestBody WorkScheduleDto request, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new UnauthorizedException("로그인이 필요합니다.");

        authService.updateWorkSchedule(userId, request.getWorkStartTime(), request.getWorkEndTime(), request.getWorkDays());
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
                request.getNickname(),
                request.getEmail()
        );

    }

    /**
     * 닉네임 사용 가능 여부 (회원가입 화면·마이페이지에서 입력하면서 확인)
     * 로그인 상태면 내 현재 닉네임은 중복으로 보지 않음
     */
    @GetMapping("/nickname/available")
    public Map<String, Object> nicknameAvailable(@RequestParam String nickname, HttpSession session) {
        String clean;
        try {
            clean = authService.normalizeNickname(nickname);
        } catch (com.growtive.common.exception.BadRequestException e) {
            return Map.of("available", false, "message", e.getMessage());
        }
        Long userId = (Long) session.getAttribute("userId");
        boolean available = authService.isNicknameAvailable(clean, userId);
        return Map.of("available", available, "message", available ? "사용할 수 있는 닉네임이에요." : "이미 사용 중인 닉네임이에요.");
    }

    /** 내 닉네임 변경 (마이페이지) */
    @PutMapping("/nickname")
    public UserResponseDto updateNickname(@RequestBody Map<String, String> body, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new UnauthorizedException("로그인이 필요합니다.");
        String saved = authService.updateNickname(userId, body.get("nickname"));
        session.setAttribute("nickname", saved);
        return new UserResponseDto(
                userId,
                (String) session.getAttribute("username"),
                (String) session.getAttribute("displayName"),
                (String) session.getAttribute("role"),
                (String) session.getAttribute("provider"),
                saved
        );
    }
}
