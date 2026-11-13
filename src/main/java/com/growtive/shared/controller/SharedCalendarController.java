package com.growtive.shared.controller;

import com.growtive.common.exception.UnauthorizedException;
import com.growtive.shared.dto.SharedCalendarCreateRequestDto;
import com.growtive.shared.dto.SharedCalendarDetailDto;
import com.growtive.shared.dto.SharedCalendarDto;
import com.growtive.shared.dto.SharedCalendarInvitationDto;
import com.growtive.shared.service.SharedCalendarService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 공유 캘린더 (친구와 함께 쓰는 가계부/일정)
 * 1단계: 생성 · 초대 · 수락/거절 · 목록 · 상세
 */
@RestController
@RequestMapping("/api/shared-calendars")
@RequiredArgsConstructor
public class SharedCalendarController {

    private final SharedCalendarService service;

    private Long getUserId(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new UnauthorizedException("로그인이 필요합니다.");
        return userId;
    }

    @PostMapping
    public SharedCalendarDto create(@RequestBody SharedCalendarCreateRequestDto req, HttpSession session) {
        return service.create(getUserId(session), req.getName(), req.getFriendUserId());
    }

    @GetMapping
    public List<SharedCalendarDto> myCalendars(HttpSession session) {
        return service.getMyCalendars(getUserId(session));
    }

    @GetMapping("/invitations")
    public List<SharedCalendarInvitationDto> invitations(HttpSession session) {
        return service.getInvitations(getUserId(session));
    }

    @PostMapping("/{calendarId}/accept")
    public void accept(@PathVariable Long calendarId, HttpSession session) {
        service.acceptInvitation(getUserId(session), calendarId);
    }

    @PostMapping("/{calendarId}/decline")
    public void decline(@PathVariable Long calendarId, HttpSession session) {
        service.declineInvitation(getUserId(session), calendarId);
    }

    @GetMapping("/{calendarId}")
    public SharedCalendarDetailDto detail(@PathVariable Long calendarId, HttpSession session) {
        return service.getDetail(getUserId(session), calendarId);
    }
}
