package com.growtive.money.service;

import com.growtive.money.dto.*;

public interface FinancialSimulationService {

    SimulationResponseDto simulate(Long userId,
                                   int startYear,
                                   int startMonth,
                                   int months);

    GoalSimulationResponseDto simulateUntilGoal(Long userId,
                                                int startYear,
                                                int startMonth,
                                                long target);

    GoalCompareResponseDto compareGoalWithExtraInvestment(Long userId,
                                                          int startYear,
                                                          int startMonth,
                                                          long target,
                                                          long monthlyIncrease);

    ChartResponseDto buildChart(Long userId,
                                int startYear,
                                int startMonth,
                                int months,
                                long target);
}