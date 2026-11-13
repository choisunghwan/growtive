package com.growtive.shared.service;

import com.growtive.common.exception.BadRequestException;
import com.growtive.common.exception.ForbiddenException;
import com.growtive.common.exception.NotFoundException;
import com.growtive.shared.dto.SharedCalendarDetailDto;
import com.growtive.shared.dto.SharedCalendarDto;
import com.growtive.shared.dto.SharedCalendarInvitationDto;
import com.growtive.shared.mapper.SharedCalendarMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SharedCalendarServiceImpl implements SharedCalendarService {

    static final String PENDING = "PENDING";
    static final String ACCEPTED = "ACCEPTED";
    private static final int NAME_MAX = 30;

    private final SharedCalendarMapper mapper;

    @Override
    @Transactional
    public SharedCalendarDto create(Long userId, String name, Long friendUserId) {
        String trimmed = name == null ? "" : name.trim();
        if (trimmed.isEmpty()) throw new BadRequestException("공유 캘린더 이름을 입력해주세요.");
        if (trimmed.length() > NAME_MAX) throw new BadRequestException("공유 캘린더 이름은 " + NAME_MAX + "자 이내로 입력해주세요.");
        if (friendUserId == null || friendUserId.equals(userId)) throw new BadRequestException("함께할 친구를 선택해주세요.");
        if (mapper.countAcceptedFriendship(userId, friendUserId) == 0) {
            throw new BadRequestException("친구로 연결된 사용자만 초대할 수 있습니다.");
        }

        Map<String, Object> params = new HashMap<>();
        params.put("name", trimmed);
        params.put("ownerId", userId);
        mapper.insertCalendar(params);
        Long calendarId = ((Number) params.get("id")).longValue();

        mapper.insertMember(calendarId, userId, ACCEPTED, userId);
        mapper.insertMember(calendarId, friendUserId, PENDING, userId);
        return mapper.findCalendar(calendarId, userId);
    }

    @Override
    public List<SharedCalendarDto> getMyCalendars(Long userId) {
        return mapper.findMyCalendars(userId);
    }

    @Override
    public List<SharedCalendarInvitationDto> getInvitations(Long userId) {
        return mapper.findPendingInvitations(userId);
    }

    @Override
    @Transactional
    public void acceptInvitation(Long userId, Long calendarId) {
        requirePendingInvitation(userId, calendarId);
        mapper.updateMemberStatus(calendarId, userId, ACCEPTED);
    }

    @Override
    @Transactional
    public void declineInvitation(Long userId, Long calendarId) {
        requirePendingInvitation(userId, calendarId);
        mapper.deleteMember(calendarId, userId);
    }

    @Override
    public SharedCalendarDetailDto getDetail(Long userId, Long calendarId) {
        requireMember(userId, calendarId);
        SharedCalendarDetailDto detail = new SharedCalendarDetailDto();
        detail.setCalendar(mapper.findCalendar(calendarId, userId));
        detail.setMembers(mapper.findMembers(calendarId));
        return detail;
    }

    @Override
    public void requireMember(Long userId, Long calendarId) {
        String status = mapper.findMemberStatus(calendarId, userId);
        if (status == null) {
            if (mapper.findCalendar(calendarId, userId) == null) throw new NotFoundException("공유 캘린더를 찾을 수 없습니다.");
            throw new ForbiddenException("이 공유 캘린더의 참여자가 아닙니다.");
        }
        if (!ACCEPTED.equals(status)) throw new ForbiddenException("초대를 수락해야 볼 수 있습니다.");
    }

    @Override
    @Transactional
    public void removeUserEverywhere(Long userId) {
        List<Long> calendarIds = mapper.findCalendarIdsOfUser(userId);
        mapper.deleteAllMembersOfUser(userId);
        for (Long calendarId : calendarIds) {
            deleteIfEmpty(calendarId);
        }
    }

    /** 참여자(수락한 사람)가 0명이면 캘린더 삭제 (남은 초대도 함께) */
    void deleteIfEmpty(Long calendarId) {
        if (mapper.countAcceptedMembers(calendarId) == 0) {
            mapper.deleteMembersOfCalendar(calendarId);
            mapper.deleteCalendar(calendarId);
        }
    }

    private void requirePendingInvitation(Long userId, Long calendarId) {
        String status = mapper.findMemberStatus(calendarId, userId);
        if (!PENDING.equals(status)) throw new NotFoundException("대기 중인 초대가 없습니다.");
    }
}
