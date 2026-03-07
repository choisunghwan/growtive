package com.growtive.money.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class MonthlySimulationResult {

    private int year;
    private int month;
    private long totalAsset;
}