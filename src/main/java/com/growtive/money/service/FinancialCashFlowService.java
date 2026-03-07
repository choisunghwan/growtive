package com.growtive.money.service;

import com.growtive.money.dto.CashFlowChartResponseDto;

public interface FinancialCashFlowService {
    CashFlowChartResponseDto getCashFlowChart(String userId, int startYear, int startMonth, int months);
}