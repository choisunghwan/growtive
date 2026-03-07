package com.growtive.money.service;

import com.growtive.money.dto.FlowResponseDto;

public interface FinancialFlowService {

    FlowResponseDto getMonthlyFlow(Long userId, int year, int month);
}