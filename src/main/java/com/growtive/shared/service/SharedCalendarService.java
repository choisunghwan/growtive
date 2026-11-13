package com.growtive.shared.service;

import com.growtive.shared.dto.InvitableFriendDto;
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

    /** 회원 삭제 시: 모든 공유 캘린더에서 빼고(관리자였으면 가장 먼저 참여한 사람에게 넘김), 참여자 0명이 된 캘린더는 삭제 */
    void removeUserEverywhere(Long userId);

    /* ----- 3단계: 멤버 관리 ----- */

    /** 이 캘린더에 초대할 수 있는 내 친구 (참여자 누구나) */
    List<InvitableFriendDto> getInvitableFriends(Long userId, Long calendarId);

    /** 친구 추가 초대 (참여자 누구나, 내 친구만) */
    void invite(Long userId, Long calendarId, Long friendUserId);

    /** 초대 취소 (👑 관리자 또는 그 초대를 보낸 사람) */
    void cancelInvitation(Long userId, Long calendarId, Long targetUserId);

    /** 이름 변경 (👑 관리자만) */
    SharedCalendarDto rename(Long userId, Long calendarId, String name);

    /** 관리자 권한 넘기기 (👑 관리자만, 대상은 참여 중인 멤버) */
    void transferOwnership(Long userId, Long calendarId, Long newOwnerId);

    /**
     * 나가기 (누구나). 관리자가 나가면 newOwnerId에게 넘김(없으면 가장 먼저 참여한 사람).
     * @return 참여자가 0명이 되어 캘린더가 삭제됐으면 true
     */
    boolean leave(Long userId, Long calendarId, Long newOwnerId);

    /** 캘린더 삭제 (👑 관리자만) — 가계부·일정·멤버·초대 모두 삭제 */
    void delete(Long userId, Long calendarId);
}
