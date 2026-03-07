package com.growtive.money.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 현금흐름 차트 추가
 */
@Getter
@AllArgsConstructor
public class CashFlowPointDto {
    private String ym;      // "2026-02"
    private long income;    // 수입 합계
    private long expense;   // 지출 합계
    private long net;       // income - expense
}