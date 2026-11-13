package com.growtive.shared.dto;

import lombok.Data;

/** 멤버 관리 요청 공용: 이름 변경(name) / 초대(friendUserId) / 관리자 넘기기·나가기(newOwnerId) */
@Data
public class SharedCalendarRequestDto {
    private String name;
    private Long friendUserId;
    private Long newOwnerId;
}
