package com.growtive.money.service;

import com.growtive.money.dto.CashFlowChartResponseDto;
import com.growtive.money.dto.CashFlowPointDto;
import com.growtive.money.mapper.FinancialCashFlowMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FinancialCashFlowServiceImpl implements FinancialCashFlowService {

    private final FinancialCashFlowMapper mapper;

    @Override
    public CashFlowChartResponseDto getCashFlowChart(Long userId, int startYear, int startMonth, int months) {

        int safeMonths = Math.max(1, Math.min(months, 120)); // 너무 큰 요청 방어
        List<CashFlowPointDto> series = mapper.findCashFlowSeries(userId, startYear, startMonth, safeMonths);

        String startYm = startYear + "-" + String.format("%02d", startMonth);

        return new CashFlowChartResponseDto(startYm, safeMonths, series);
    }
}