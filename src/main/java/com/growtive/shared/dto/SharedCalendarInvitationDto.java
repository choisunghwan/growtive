package com.growtive.shared.dto;

import lombok.Data;

import java.time.LocalDateTime;

/** 나에게 온 공유 캘린더 초대 */
@Data
public class SharedCalendarInvitationDto {
    private Long calendarId;
    private String calendarName;
    private String invitedByDisplayName;
    private LocalDateTime createdAt;
}
