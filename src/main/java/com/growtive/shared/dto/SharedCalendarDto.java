package com.growtive.shared.dto;

import lombok.Data;

import java.time.LocalDateTime;

/** 공유 캘린더 (사이드바 목록 / 상세 공용) */
@Data
public class SharedCalendarDto {
    private Long id;
    private String name;
    private Long ownerId;
    private String ownerDisplayName;
    /** 요청한 사용자가 👑 관리자인지 (owner_id = 관리자, 처음엔 만든 사람) */
    private boolean owner;
    /** 참여 중(수락한) 인원 */
    private int memberCount;
    private LocalDateTime createdAt;
    /** (특정 친구와 함께 쓰는 캘린더 조회 시) 그 친구의 상태: ACCEPTED / PENDING */
    private String otherStatus;
}
