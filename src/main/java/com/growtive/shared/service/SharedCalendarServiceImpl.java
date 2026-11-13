package com.growtive.shared.service;

import com.growtive.common.exception.BadRequestException;
import com.growtive.common.exception.ForbiddenException;
import com.growtive.common.exception.NotFoundException;
import com.growtive.shared.dto.InvitableFriendDto;
import com.growtive.shared.dto.SharedCalendarDetailDto;
import com.growtive.shared.dto.SharedCalendarDto;
import com.growtive.shared.dto.SharedCalendarInvitationDto;
import com.growtive.shared.mapper.SharedCalendarMapper;
import com.growtive.shared.mapper.SharedEntryMapper;
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
    private final SharedEntryMapper entryMapper;

    @Override
    @Transactional
    public SharedCalendarDto create(Long userId, String name, Long friendUserId) {
        String trimmed = validName(name);
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
        mapper.acceptMember(calendarId, userId);
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
        for (Long calendarId : mapper.findCalendarIdsOfUser(userId)) {
            SharedCalendarDto cal = mapper.findCalendar(calendarId, userId);
            if (cal != null && cal.isOwner()) {
                // 관리자였으면 가장 먼저 참여한 사람에게 넘김 (남은 사람이 없으면 아래에서 캘린더 삭제)
                Long next = mapper.findEarliestAcceptedMember(calendarId, userId);
                if (next != null) mapper.updateOwner(calendarId, next);
            }
            mapper.deleteMember(calendarId, userId);
            deleteIfEmpty(calendarId);
        }
    }

    /** 참여자(수락한 사람)가 0명이면 캘린더 삭제 (가계부·일정·남은 초대도 함께) */
    boolean deleteIfEmpty(Long calendarId) {
        if (mapper.countAcceptedMembers(calendarId) > 0) return false;
        deleteCompletely(calendarId);
        return true;
    }

    private void deleteCompletely(Long calendarId) {
        entryMapper.deleteAllTransactionsOfCalendar(calendarId);
        entryMapper.deleteAllEventsOfCalendar(calendarId);
        mapper.deleteMembersOfCalendar(calendarId);
        mapper.deleteCalendar(calendarId);
    }

    /* ======================= 3단계: 멤버 관리 ======================= */

    @Override
    public List<InvitableFriendDto> getInvitableFriends(Long userId, Long calendarId) {
        requireMember(userId, calendarId);
        return mapper.findInvitableFriends(calendarId, userId);
    }

    @Override
    @Transactional
    public void invite(Long userId, Long calendarId, Long friendUserId) {
        requireMember(userId, calendarId);
        if (friendUserId == null || friendUserId.equals(userId)) throw new BadRequestException("초대할 친구를 선택해주세요.");
        if (mapper.countAcceptedFriendship(userId, friendUserId) == 0) {
            throw new BadRequestException("친구로 연결된 사용자만 초대할 수 있습니다.");
        }
        String status = mapper.findMemberStatus(calendarId, friendUserId);
        if (ACCEPTED.equals(status)) throw new BadRequestException("이미 참여 중인 사용자입니다.");
        if (PENDING.equals(status)) throw new BadRequestException("이미 초대한 사용자입니다.");
        mapper.insertMember(calendarId, friendUserId, PENDING, userId);
    }

    @Override
    @Transactional
    public void cancelInvitation(Long userId, Long calendarId, Long targetUserId) {
        requireMember(userId, calendarId);
        if (!PENDING.equals(mapper.findMemberStatus(calendarId, targetUserId))) {
            throw new NotFoundException("대기 중인 초대가 없습니다.");
        }
        boolean isOwner = mapper.findCalendar(calendarId, userId).isOwner();
        if (!isOwner && !userId.equals(mapper.findInvitedBy(calendarId, targetUserId))) {
            throw new ForbiddenException("관리자나 초대를 보낸 사람만 취소할 수 있습니다.");
        }
        mapper.deleteMember(calendarId, targetUserId);
    }

    @Override
    @Transactional
    public SharedCalendarDto rename(Long userId, Long calendarId, String name) {
        requireOwner(userId, calendarId);
        mapper.updateName(calendarId, validName(name));
        return mapper.findCalendar(calendarId, userId);
    }

    @Override
    @Transactional
    public void transferOwnership(Long userId, Long calendarId, Long newOwnerId) {
        requireOwner(userId, calendarId);
        if (newOwnerId == null || newOwnerId.equals(userId)) throw new BadRequestException("관리자를 넘길 사람을 선택해주세요.");
        if (!ACCEPTED.equals(mapper.findMemberStatus(calendarId, newOwnerId))) {
            throw new BadRequestException("참여 중인 멤버에게만 관리자를 넘길 수 있습니다.");
        }
        mapper.updateOwner(calendarId, newOwnerId);
    }

    @Override
    @Transactional
    public boolean leave(Long userId, Long calendarId, Long newOwnerId) {
        requireMember(userId, calendarId);
        if (mapper.findCalendar(calendarId, userId).isOwner()) {
            Long next = newOwnerId;
            if (next == null) next = mapper.findEarliestAcceptedMember(calendarId, userId);
            if (next != null) {
                if (next.equals(userId) || !ACCEPTED.equals(mapper.findMemberStatus(calendarId, next))) {
                    throw new BadRequestException("참여 중인 멤버에게만 관리자를 넘길 수 있습니다.");
                }
                mapper.updateOwner(calendarId, next);
            }
        }
        mapper.deleteMember(calendarId, userId);
        return deleteIfEmpty(calendarId);
    }

    @Override
    @Transactional
    public void delete(Long userId, Long calendarId) {
        requireOwner(userId, calendarId);
        deleteCompletely(calendarId);
    }

    private void requireOwner(Long userId, Long calendarId) {
        requireMember(userId, calendarId);
        if (!mapper.findCalendar(calendarId, userId).isOwner()) {
            throw new ForbiddenException("👑 관리자만 할 수 있습니다.");
        }
    }

    private String validName(String name) {
        String trimmed = name == null ? "" : name.trim();
        if (trimmed.isEmpty()) throw new BadRequestException("공유 캘린더 이름을 입력해주세요.");
        if (trimmed.length() > NAME_MAX) throw new BadRequestException("공유 캘린더 이름은 " + NAME_MAX + "자 이내로 입력해주세요.");
        return trimmed;
    }

    private void requirePendingInvitation(Long userId, Long calendarId) {
        String status = mapper.findMemberStatus(calendarId, userId);
        if (!PENDING.equals(status)) throw new NotFoundException("대기 중인 초대가 없습니다.");
    }
}
