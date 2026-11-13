package com.growtive.shared.dto;

import lombok.Data;

/** 이 공유 캘린더에 초대할 수 있는 내 친구 (아직 멤버/초대 대기가 아닌 사람) */
@Data
public class InvitableFriendDto {
    private Long userId;
    private String username;
    private String displayName;
}
