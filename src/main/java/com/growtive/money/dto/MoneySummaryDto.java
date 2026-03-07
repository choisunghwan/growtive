package com.growtive.money.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class MoneySummaryDto {

    private Long totalIncome;
    private Long totalExpense;
    private Long totalAssetInvestment;
    private Long remaining;
}