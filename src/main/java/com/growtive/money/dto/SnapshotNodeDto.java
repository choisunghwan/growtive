package com.growtive.money.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SnapshotNodeDto {
    private Long id;
    private String name;
    private String type;
    private Long monthlyAmount;
}