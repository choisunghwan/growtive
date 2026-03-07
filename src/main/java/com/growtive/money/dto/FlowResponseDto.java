package com.growtive.money.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class FlowResponseDto {

    private List<FlowNodeDto> nodes;
    private List<FlowLinkDto> links;
}