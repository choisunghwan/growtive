package com.growtive.money.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FlowNodeDto {

    private Long id;
    private String name;
    private String type;
    private Long monthlyAmount;
}