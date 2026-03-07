package com.growtive.money.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FlowLinkDto {

    private Long source;
    private Long target;
    private Long value;
}