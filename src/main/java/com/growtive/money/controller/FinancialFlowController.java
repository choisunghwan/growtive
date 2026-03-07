package com.growtive.money.controller;

import com.growtive.money.dto.FlowResponseDto;
import com.growtive.money.service.FinancialFlowService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/money")
@RequiredArgsConstructor
public class FinancialFlowController {

    private final FinancialFlowService service;

    private Long getUserId(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("로그인이 필요합니다.");
        }
        return userId;
    }

    @GetMapping("/flow")
    public FlowResponseDto getFlow(
            @RequestParam int year,
            @RequestParam int month,
            HttpSession session) {

        Long userId = getUserId(session);

        return service.getMonthlyFlow(userId, year, month);
    }
}