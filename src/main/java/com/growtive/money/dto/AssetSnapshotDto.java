package com.growtive.money.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@AllArgsConstructor
public class AssetSnapshotDto {

    /**
     * 스냅샷 자산 ID
     * financial_node_snapshot.id
     */
    private Long id;

    /**
     * 현재 자산 잔액
     * financial_node_snapshot.current_balance
     */
    private Long currentBalance;

    /**
     * 예상 연 수익률 (%)
     * financial_node_snapshot.expected_annual_return
     */
    private BigDecimal expectedAnnualReturn;

    /**
     * 월 투자 금액
     * financial_node_snapshot.monthly_amount
     *
     * 시뮬레이션에서 미래 자산 증가 계산에 사용
     */
    private Long monthlyAmount;
}