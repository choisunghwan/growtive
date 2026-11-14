package com.growtive.auth.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalTime;

/**
 * 실시간 급여 카운터에 쓰이는 근무 스케줄 (근무 시작/종료 시간, 근무 요일)
 */
@Getter
@Setter
public class WorkScheduleDto {

    private LocalTime workStartTime;
    private LocalTime workEndTime;
    private String workDays; // 예: "MON,TUE,WED,THU,FRI"

    /** 월급날 규칙: null(설정 안 함) / DAY / LAST_DAY / NTH_WEEKDAY */
    private String payRule;
    private Integer payDay;      // DAY: 1~31
    private Integer payWeek;     // NTH_WEEKDAY: 1~4, -1 = 마지막 주
    private Integer payWeekday;  // NTH_WEEKDAY: 0=일 ~ 6=토
    private String payAdjust;    // BEFORE / AFTER / KEEP
    /** 월급 금액: LEDGER(가계부 최근 '월급' 내역) / FIXED(고정 금액) */
    private String salaryMode;
    private Long salaryAmount;
    /** 게이지 방식: SALARY(근무 시간에 따라 쌓임) / BALANCE(남은 돈) */
    private String incomeType;
    /** 고정 금액을 자동 기록할 수입 카테고리 (기본 '용돈') */
    private String incomeCategory;
    /** (조회 전용) 자동 기록 시작 기준일 */
    private java.time.LocalDate autoIncomeFrom;

}
