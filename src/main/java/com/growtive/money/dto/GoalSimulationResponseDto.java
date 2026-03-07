package com.growtive.money.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class GoalSimulationResponseDto {

    private long target;
    private int achievedYear;
    private int achievedMonth;
    private int monthsRequired;
}