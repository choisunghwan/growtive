package com.growtive.money.service;

import com.growtive.money.dto.MoneySummaryDto;
import com.growtive.money.mapper.FinancialSummaryMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FinancialSummaryServiceImpl implements FinancialSummaryService {

    private final FinancialSummaryMapper mapper;

    @Override
    public MoneySummaryDto getMonthlySummary(String userId, int year, int month) {

        Long income = mapper.sumIncome(userId, year, month);
        Long expense = mapper.sumExpense(userId, year, month);
        Long asset = mapper.sumAssetInvestment(userId, year, month);

        Long remaining = income - expense - asset;

        return new MoneySummaryDto(income, expense, asset, remaining);
    }
}