package com.growtive.shared.dto;

import lombok.Data;

/** 공유 캘린더 생성: 이름 + 처음 초대할 친구 */
@Data
public class SharedCalendarCreateRequestDto {
    private String name;
    private Long friendUserId;
}
