package com.growtive.money.controller;

import com.growtive.money.dto.MoneySummaryDto;
import com.growtive.money.service.FinancialSummaryService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/money")
@RequiredArgsConstructor
public class FinancialSummaryController {

    private final FinancialSummaryService service;

    private Long getUserId(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("로그인이 필요합니다.");
        }
        return userId;
    }

    @GetMapping("/summary")
    public MoneySummaryDto getSummary(
            @RequestParam int year,
            @RequestParam int month,
            HttpSession session) {

        Long userId = getUserId(session);

        return service.getMonthlySummary(userId, year, month);
    }
}