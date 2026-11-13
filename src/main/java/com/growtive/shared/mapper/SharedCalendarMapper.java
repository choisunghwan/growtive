package com.growtive.shared.mapper;

import com.growtive.shared.dto.SharedCalendarDto;
import com.growtive.shared.dto.SharedCalendarInvitationDto;
import com.growtive.shared.dto.SharedCalendarMemberDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface SharedCalendarMapper {

    /** 생성 후 params.id 에 새 id가 담김 (keys: name, ownerId, id) */
    int insertCalendar(Map<String, Object> params);

    int insertMember(@Param("calendarId") Long calendarId,
                     @Param("userId") Long userId,
                     @Param("status") String status,
                     @Param("invitedBy") Long invitedBy);

    /** 두 사람이 친구(ACCEPTED)인지 */
    int countAcceptedFriendship(@Param("a") Long a, @Param("b") Long b);

    /** 내가 참여 중(ACCEPTED)인 공유 캘린더 목록 */
    List<SharedCalendarDto> findMyCalendars(@Param("userId") Long userId);

    /** 나에게 온 초대(PENDING) */
    List<SharedCalendarInvitationDto> findPendingInvitations(@Param("userId") Long userId);

    /** 이 캘린더에서 나의 상태 (없으면 null) */
    String findMemberStatus(@Param("calendarId") Long calendarId, @Param("userId") Long userId);

    int updateMemberStatus(@Param("calendarId") Long calendarId,
                           @Param("userId") Long userId,
                           @Param("status") String status);

    int deleteMember(@Param("calendarId") Long calendarId, @Param("userId") Long userId);

    SharedCalendarDto findCalendar(@Param("calendarId") Long calendarId, @Param("userId") Long userId);

    List<SharedCalendarMemberDto> findMembers(@Param("calendarId") Long calendarId);

    int countAcceptedMembers(@Param("calendarId") Long calendarId);

    /** 이 사용자가 속한(초대 대기 포함) 캘린더 id들 */
    List<Long> findCalendarIdsOfUser(@Param("userId") Long userId);

    int deleteAllMembersOfUser(@Param("userId") Long userId);

    int deleteMembersOfCalendar(@Param("calendarId") Long calendarId);

    int deleteCalendar(@Param("calendarId") Long calendarId);
}
