package com.growtive.user.model;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Setter
public class User {

    private Long id;

    private String username;
    private String password;

    private String displayName;

    /** 다른 사람에게 보이는 이름. 없으면(NULL) displayName을 대신 보여준다 */
    private String nickname;
    private String email;

    private String provider;
    private String providerId;

    /**
     * USER / ADMIN
     */
    private String role;

    private LocalDateTime lastLoginAt;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * 실시간 급여 카운터용 근무 스케줄 설정
     */
    private LocalTime workStartTime;
    private LocalTime workEndTime;
    private String workDays; // 예: "MON,TUE,WED,THU,FRI"

}