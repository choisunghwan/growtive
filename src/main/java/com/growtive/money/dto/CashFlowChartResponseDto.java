package com.growtive.money.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class CashFlowChartResponseDto {
    private String startYm;
    private int months;
    private List<CashFlowPointDto> series;
}