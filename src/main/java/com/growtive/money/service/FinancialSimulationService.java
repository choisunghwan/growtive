package com.growtive.money.service;

import com.growtive.money.dto.*;

public interface FinancialSimulationService {

    SimulationResponseDto simulate(String userId,
                                   int startYear,
                                   int startMonth,
                                   int months);

    GoalSimulationResponseDto simulateUntilGoal(String userId,
                                                int startYear,
                                                int startMonth,
                                                long target);

    GoalCompareResponseDto compareGoalWithExtraInvestment(String userId,
                                                          int startYear,
                                                          int startMonth,
                                                          long target,
                                                          long monthlyIncrease);

    ChartResponseDto buildChart(String userId,
                                int startYear,
                                int startMonth,
                                int months,
                                long target);
}