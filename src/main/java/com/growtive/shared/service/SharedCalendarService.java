package com.growtive.shared.service;

import com.growtive.shared.dto.SharedCalendarDetailDto;
import com.growtive.shared.dto.SharedCalendarDto;
import com.growtive.shared.dto.SharedCalendarInvitationDto;

import java.util.List;

public interface SharedCalendarService {

    /** 공유 캘린더 생성 (만든 사람은 바로 참여, 친구는 초대 대기) */
    SharedCalendarDto create(Long userId, String name, Long friendUserId);

    /** 내가 참여 중인 공유 캘린더 */
    List<SharedCalendarDto> getMyCalendars(Long userId);

    /** 나에게 온 초대 */
    List<SharedCalendarInvitationDto> getInvitations(Long userId);

    void acceptInvitation(Long userId, Long calendarId);

    void declineInvitation(Long userId, Long calendarId);

    /** 상세 (참여 중인 멤버만 볼 수 있음) */
    SharedCalendarDetailDto getDetail(Long userId, Long calendarId);

    /** 참여 중인 멤버인지 확인 (아니면 403/404) — 2단계 가계부·일정 API에서도 사용 */
    void requireMember(Long userId, Long calendarId);

    /** 회원 삭제 시: 모든 공유 캘린더에서 빼고, 참여자가 0명이 된 캘린더는 삭제 */
    void removeUserEverywhere(Long userId);
}
