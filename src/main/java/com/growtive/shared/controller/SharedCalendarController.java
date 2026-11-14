package com.growtive.shared.controller;

import com.growtive.common.exception.UnauthorizedException;
import com.growtive.shared.dto.SharedCalendarCreateRequestDto;
import com.growtive.shared.dto.SharedCalendarDetailDto;
import com.growtive.shared.dto.SharedCalendarDto;
import com.growtive.shared.dto.SharedCalendarInvitationDto;
import com.growtive.shared.dto.SharedCalendarRequestDto;
import com.growtive.shared.dto.InvitableFriendDto;
import com.growtive.shared.service.SharedCalendarService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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

    /** 이 친구와 이미 함께 쓰는 공유 캘린더 (공유 캘린더 생성 창에서 안내용) */
    @GetMapping("/with/{otherUserId}")
    public List<SharedCalendarDto> calendarsWith(@PathVariable Long otherUserId, HttpSession session) {
        return service.getCalendarsWith(getUserId(session), otherUserId);
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

    /* ----- 3단계: 멤버 관리 ----- */

    @GetMapping("/{calendarId}/invitable-friends")
    public List<InvitableFriendDto> invitableFriends(@PathVariable Long calendarId, HttpSession session) {
        return service.getInvitableFriends(getUserId(session), calendarId);
    }

    @PostMapping("/{calendarId}/invitations")
    public void invite(@PathVariable Long calendarId, @RequestBody SharedCalendarRequestDto req, HttpSession session) {
        service.invite(getUserId(session), calendarId, req.getFriendUserId());
    }

    @DeleteMapping("/{calendarId}/invitations/{targetUserId}")
    public void cancelInvitation(@PathVariable Long calendarId, @PathVariable Long targetUserId, HttpSession session) {
        service.cancelInvitation(getUserId(session), calendarId, targetUserId);
    }

    @PutMapping("/{calendarId}")
    public SharedCalendarDto rename(@PathVariable Long calendarId, @RequestBody SharedCalendarRequestDto req,
                                    HttpSession session) {
        return service.rename(getUserId(session), calendarId, req.getName());
    }

    @PostMapping("/{calendarId}/transfer")
    public void transfer(@PathVariable Long calendarId, @RequestBody SharedCalendarRequestDto req, HttpSession session) {
        service.transferOwnership(getUserId(session), calendarId, req.getNewOwnerId());
    }

    /** 나가기 — 응답 { deleted: true }면 참여자 0명이 되어 캘린더가 삭제됨 */
    @PostMapping("/{calendarId}/leave")
    public Map<String, Boolean> leave(@PathVariable Long calendarId,
                                      @RequestBody(required = false) SharedCalendarRequestDto req, HttpSession session) {
        Long newOwnerId = req == null ? null : req.getNewOwnerId();
        return Map.of("deleted", service.leave(getUserId(session), calendarId, newOwnerId));
    }

    @DeleteMapping("/{calendarId}")
    public void delete(@PathVariable Long calendarId, HttpSession session) {
        service.delete(getUserId(session), calendarId);
    }
}
