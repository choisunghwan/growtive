package com.growtive.money.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class ChartSimulationResponseDto {

    private List<String> labels;
    private List<Long> assetSeries;
    private List<Long> targetLine;
}