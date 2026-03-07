package com.growtive.money.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class FinancialNodeTemplateDto {

    private Long id;
    private String userId;

    /**
     * 항목 이름 (예: 월급, 식비, 적금)
     */
    private String name;

    /**
     * 타입: INCOME / EXPENSE / ASSET
     */
    private String type;

    /**
     * 기본 월 금액
     */
    private Long defaultMonthlyAmount;

    /**
     * 기본 기대 수익률 (%)
     * - INCOME/EXPENSE 는 보통 null 또는 0
     * - ASSET 에서 사용
     */
    private BigDecimal defaultExpectedReturn;
}