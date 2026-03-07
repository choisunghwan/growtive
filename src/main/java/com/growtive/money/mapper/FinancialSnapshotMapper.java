package com.growtive.money.mapper;

import com.growtive.money.dto.SnapshotNodeDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface FinancialSnapshotMapper {

    int countSnapshot(
            @Param("userId") Long userId,
            @Param("year") int year,
            @Param("month") int month
    );

    int insertSnapshotFromTemplate(
            @Param("userId") Long userId,
            @Param("year") int year,
            @Param("month") int month
    );

    int insertMissingSnapshotNodesFromTemplate(
            @Param("userId") Long userId,
            @Param("year") int year,
            @Param("month") int month
    );

    int copyPreviousAssetBalance(
            @Param("userId") Long userId,
            @Param("year") int year,
            @Param("month") int month,
            @Param("prevYear") int prevYear,
            @Param("prevMonth") int prevMonth
    );

    int insertFlowSnapshot(
            @Param("userId") Long userId,
            @Param("year") int year,
            @Param("month") int month
    );

    int insertMissingFlowSnapshot(
            @Param("userId") Long userId,
            @Param("year") int year,
            @Param("month") int month
    );

    int updateMonthlyAmountBySnapshotId(
            @Param("userId") Long userId,
            @Param("snapshotId") Long snapshotId,
            @Param("amount") Long amount
    );

    int updateMonthlyAmountByName(
            @Param("userId") Long userId,
            @Param("year") int year,
            @Param("month") int month,
            @Param("name") String name,
            @Param("amount") Long amount
    );

    List<SnapshotNodeDto> findSnapshotNodes(
            @Param("userId") Long userId,
            @Param("year") int year,
            @Param("month") int month
    );
}