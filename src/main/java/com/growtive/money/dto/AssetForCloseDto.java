package com.growtive.money.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@AllArgsConstructor
public class AssetForCloseDto {

    private Long id;
    private Long currentBalance;
    private BigDecimal expectedAnnualReturn;
}