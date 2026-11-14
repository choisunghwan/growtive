package com.growtive.friend.service;

import com.growtive.friend.dto.FriendConnectionDto;
import com.growtive.friend.mapper.UserBasic;

import java.util.List;

public interface FriendService {

    FriendConnectionDto createRequest(Long userId, String targetUsername);

    /** 아이디 또는 이름(닉네임)으로 사용자 검색 */
    List<UserBasic> searchUsers(Long userId, String query);

    List<FriendConnectionDto> getIncoming(Long userId);

    List<FriendConnectionDto> getOutgoing(Long userId);

    List<FriendConnectionDto> getFriends(Long userId);

    void accept(Long userId, Long connectionId);

    void remove(Long userId, Long connectionId);


}
