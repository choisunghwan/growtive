package com.growtive.money.controller;

import com.growtive.money.dto.CashFlowChartResponseDto;
import com.growtive.money.service.FinancialCashFlowService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/money")
@RequiredArgsConstructor
public class FinancialCashFlowController {

    private final FinancialCashFlowService cashFlowService;

    private Long getUserId(HttpSession session) {
        Object v = session.getAttribute("userId");
        if (v == null) throw new IllegalStateException("로그인이 필요합니다.");
        return (Long) v;
    }

    /**
     * 현금흐름 차트
     * 예) /api/money/cashflow?startYear=2026&startMonth=2&months=12
     */
    @GetMapping("/cashflow")
    public CashFlowChartResponseDto cashflow(
            HttpSession session,
            @RequestParam int startYear,
            @RequestParam int startMonth,
            @RequestParam(defaultValue = "12") int months
    ) {
        Long userId = getUserId(session);
        return cashFlowService.getCashFlowChart(userId, startYear, startMonth, months);
    }
}