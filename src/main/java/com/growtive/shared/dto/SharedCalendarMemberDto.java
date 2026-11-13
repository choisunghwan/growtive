package com.growtive.shared.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class SharedCalendarMemberDto {
    private Long userId;
    private String username;
    private String displayName;
    /** PENDING(초대 대기) / ACCEPTED(참여 중) */
    private String status;
    /** 👑 관리자인지 (처음엔 만든 사람, 권한을 넘기면 바뀜) */
    private boolean owner;
    /** 초대한 사람 (초대 취소 권한 확인용) */
    private Long invitedBy;
    /** 참여(수락)한 시각 — 관리자가 나갈 때 기본 후임자 = 가장 먼저 참여한 사람 */
    private LocalDateTime joinedAt;
}
