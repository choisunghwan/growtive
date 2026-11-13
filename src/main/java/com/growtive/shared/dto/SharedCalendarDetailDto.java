package com.growtive.shared.dto;

import lombok.Data;

import java.util.List;

@Data
public class SharedCalendarDetailDto {
    private SharedCalendarDto calendar;
    private List<SharedCalendarMemberDto> members;
}
