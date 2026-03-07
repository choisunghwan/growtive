package com.growtive.money.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class MonthlySnapshotUpdateRequestDto {
    private int year;
    private int month;
    private List<NodeAmountDto> nodes;

    @Getter
    @Setter
    public static class NodeAmountDto {
        private Long snapshotId;   // 있으면 이걸로 업데이트(권장)
        private String name;       // snapshotId 없을 때 fallback
        private Long amount;
    }
}