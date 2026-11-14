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

    /** 월급날 규칙 (null이면 매달 1일~말일 기준) — UserPaydayColumnInitializer 참고 */
    private String payRule;
    private Integer payDay;
    private Integer payWeek;
    private Integer payWeekday;
    private String payAdjust;
    /** 월급 금액 방식: LEDGER(가계부 최근 '월급' 내역) / FIXED(고정 금액), null이면 LEDGER */
    private String salaryMode;
    private Long salaryAmount;
    /** 수입 형태: SALARY(월급) / ALLOWANCE(용돈·정기 수입) / BUDGET(예산), null이면 SALARY */
    private String incomeType;
    private String incomeCategory;

}