package com.growtive.shared.dto;

import lombok.Data;

@Data
public class SharedCalendarMemberDto {
    private Long userId;
    private String username;
    private String displayName;
    /** PENDING(초대 대기) / ACCEPTED(참여 중) */
    private String status;
    /** 만든 사람인지 */
    private boolean owner;
}
