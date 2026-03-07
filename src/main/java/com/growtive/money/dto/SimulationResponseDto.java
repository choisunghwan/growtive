package com.growtive.money.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class SimulationResponseDto {

    private String startMonth;
    private int months;
    private long totalAssetAfter;
    private List<MonthlySimulationResult> monthlyResult;
}