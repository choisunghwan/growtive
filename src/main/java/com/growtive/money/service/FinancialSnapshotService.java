package com.growtive.money.service;

import com.growtive.money.dto.MonthlySnapshotUpdateRequestDto;
import com.growtive.money.dto.SnapshotNodeDto;

import java.util.List;

public interface FinancialSnapshotService {

    /**
     * 현재 월 snapshot이 없으면 생성
     */
    void createMonthlySnapshotIfNotExists(String userId);

    /**
     * 특정 년/월 snapshot이 없으면 생성
     */
    void createMonthlySnapshotIfNotExists(String userId, int year, int month);

    /**
     * snapshot 생성 보장 + monthly_amount 업데이트
     */
    void ensureAndUpdateMonthlySnapshot(
            String userId,
            MonthlySnapshotUpdateRequestDto request
    );

    /**
     * 특정 월 snapshot 노드 조회
     */
    List<SnapshotNodeDto> getMonthlySnapshotNodes(
            String userId,
            int year,
            int month
    );
}