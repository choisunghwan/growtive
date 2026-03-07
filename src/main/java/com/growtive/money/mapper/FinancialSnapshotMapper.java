package com.growtive.money.mapper;

import com.growtive.money.dto.SnapshotNodeDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface FinancialSnapshotMapper {

    int countSnapshot(
            @Param("userId") String userId,
            @Param("year") int year,
            @Param("month") int month
    );

    int insertSnapshotFromTemplate(
            @Param("userId") String userId,
            @Param("year") int year,
            @Param("month") int month
    );

    int insertMissingSnapshotNodesFromTemplate(
            @Param("userId") String userId,
            @Param("year") int year,
            @Param("month") int month
    );

    int copyPreviousAssetBalance(
            @Param("userId") String userId,
            @Param("year") int year,
            @Param("month") int month,
            @Param("prevYear") int prevYear,
            @Param("prevMonth") int prevMonth
    );

    int insertFlowSnapshot(
            @Param("userId") String userId,
            @Param("year") int year,
            @Param("month") int month
    );

    int insertMissingFlowSnapshot(
            @Param("userId") String userId,
            @Param("year") int year,
            @Param("month") int month
    );

    int updateMonthlyAmountBySnapshotId(
            @Param("userId") String userId,
            @Param("snapshotId") Long snapshotId,
            @Param("amount") Long amount
    );

    int updateMonthlyAmountByName(
            @Param("userId") String userId,
            @Param("year") int year,
            @Param("month") int month,
            @Param("name") String name,
            @Param("amount") Long amount
    );

    List<SnapshotNodeDto> findSnapshotNodes(
            @Param("userId") String userId,
            @Param("year") int year,
            @Param("month") int month
    );
}