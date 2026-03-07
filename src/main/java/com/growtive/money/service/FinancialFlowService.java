package com.growtive.money.service;

import com.growtive.money.dto.FlowResponseDto;

public interface FinancialFlowService {

    FlowResponseDto getMonthlyFlow(String userId, int year, int month);
}