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
    /** 요청한 사용자가 만든 사람인지 */
    private boolean owner;
    /** 참여 중(수락한) 인원 */
    private int memberCount;
    private LocalDateTime createdAt;
}
