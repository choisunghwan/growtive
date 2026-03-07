package com.growtive.money.service;

import com.growtive.money.dto.MoneySummaryDto;

public interface FinancialSummaryService {

    MoneySummaryDto getMonthlySummary(String userId, int year, int month);
}