package com.growtive.money.mapper;

import com.growtive.money.dto.AssetSnapshotDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface FinancialSimulationMapper {

    // ✅ 스냅샷 기반 자산 조회 (ASSET)
    List<AssetSnapshotDto> findAssetSnapshots(
            @Param("userId") Long userId,
            @Param("year") int year,
            @Param("month") int month
    );

    // ✅ 스냅샷 기반: 특정 자산으로 들어오는 월 유입(flow_snapshot.amount 합)
    Long sumMonthlyInflowToAssetSnapshot(
            @Param("userId") Long userId,
            @Param("year") int year,
            @Param("month") int month,
            @Param("assetSnapshotId") Long assetSnapshotId
    );

    // (기존 템플릿 기반 메서드들 남겨둬도 됨)
    List<AssetSnapshotDto> findAssetTemplates(@Param("userId") Long userId);

    Long sumMonthlyInflowToAssetTemplate(
            @Param("userId") Long userId,
            @Param("assetTemplateId") Long assetTemplateId
    );
}