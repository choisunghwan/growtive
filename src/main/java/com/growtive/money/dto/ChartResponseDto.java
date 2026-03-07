package com.growtive.money.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class ChartResponseDto {

    private List<String> labels;      // x축 날짜
    private List<Long> assetSeries;   // 기본 투자 자산
    private List<Long> extraSeries;   // +20만원 투자 자산
    private List<Long> targetLine;    // 목표선
}