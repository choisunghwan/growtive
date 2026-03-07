package com.growtive.money.controller;

import com.growtive.money.dto.ChartResponseDto;
import com.growtive.money.dto.GoalCompareResponseDto;
import com.growtive.money.dto.GoalSimulationResponseDto;
import com.growtive.money.dto.SimulationResponseDto;
import com.growtive.money.service.FinancialSimulationService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/money")
@RequiredArgsConstructor
public class FinancialSimulationController {

    private final FinancialSimulationService service;

    private String getUserId(HttpSession session) {
        String userId = (String) session.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("로그인이 필요합니다.");
        }
        return userId;
    }

    @GetMapping("/simulate")
    public SimulationResponseDto simulate(@RequestParam int year,
                                          @RequestParam int month,
                                          @RequestParam int months,
                                          HttpSession session) {

        String userId = getUserId(session);
        return service.simulate(userId, year, month, months);
    }

    @GetMapping("/goal")
    public GoalSimulationResponseDto goal(@RequestParam int year,
                                          @RequestParam int month,
                                          @RequestParam long target,
                                          HttpSession session) {

        String userId = getUserId(session);
        return service.simulateUntilGoal(userId, year, month, target);
    }

    @GetMapping("/compare-goal")
    public GoalCompareResponseDto compareGoal(@RequestParam int year,
                                              @RequestParam int month,
                                              @RequestParam long target,
                                              @RequestParam long monthlyIncrease,
                                              HttpSession session) {

        String userId = getUserId(session);
        return service.compareGoalWithExtraInvestment(
                userId, year, month, target, monthlyIncrease
        );
    }

    @GetMapping("/chart")
    public ChartResponseDto chart(@RequestParam int year,
                                  @RequestParam int month,
                                  @RequestParam int months,
                                  @RequestParam long target,
                                  HttpSession session) {

        String userId = getUserId(session);
        return service.buildChart(userId, year, month, months, target);
    }
}