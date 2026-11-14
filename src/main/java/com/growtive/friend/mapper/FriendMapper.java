package com.growtive.friend.mapper;

import com.growtive.friend.dto.FriendConnectionDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface FriendMapper {

    /** username으로 사용자 기본 정보 조회 (password 미포함) */
    UserBasic findUserBasicByUsername(@Param("username") String username);

    /** 아이디 또는 이름(닉네임)으로 사용자 검색 (본인 제외, 최대 20명) */
    List<UserBasic> searchUsers(@Param("query") String query, @Param("excludeUserId") Long excludeUserId);

    /** id로 사용자 기본 정보 조회 (password 미포함) */
    UserBasic findUserBasicById(@Param("id") Long id);

    /** 두 사용자 사이에 이미 (PENDING/ACCEPTED) 연결이 있는지 확인 */
    int countExistingBetween(@Param("userA") Long userA, @Param("userB") Long userB);

    int insertRequest(@Param("row") FriendConnectionRow row);

    FriendConnectionRow findById(@Param("id") Long id);

    int updateStatus(@Param("id") Long id, @Param("status") String status);

    int deleteById(@Param("id") Long id);

    /** 나에게 온 대기중인 요청 (상대방 = 요청을 보낸 사람) */
    List<FriendConnectionDto> findIncoming(@Param("userId") Long userId);

    /** 내가 보낸 대기중인 요청 (상대방 = 요청 받은 사람) */
    List<FriendConnectionDto> findOutgoing(@Param("userId") Long userId);

    /** 수락된 연결 (상대방 = 나 아닌 쪽) */
    List<FriendConnectionDto> findAccepted(@Param("userId") Long userId);


}
