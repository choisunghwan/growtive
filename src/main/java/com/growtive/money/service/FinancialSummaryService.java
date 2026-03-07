package com.growtive.money.service;

import com.growtive.money.dto.MoneySummaryDto;

public interface FinancialSummaryService {

    MoneySummaryDto getMonthlySummary(Long userId, int year, int month);
}