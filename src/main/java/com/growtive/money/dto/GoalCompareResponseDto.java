package com.growtive.money.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class GoalCompareResponseDto {

    private long target;

    private int originalMonthsRequired;
    private int improvedMonthsRequired;

    private int monthsSaved;

    private int improvedYear;
    private int improvedMonth;
}