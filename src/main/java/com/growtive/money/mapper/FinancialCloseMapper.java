package com.growtive.money.mapper;

import com.growtive.money.dto.AssetForCloseDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface FinancialCloseMapper {

    List<Long> findAssetSnapshotIds(@Param("userId") Long userId,
                                    @Param("year") int year,
                                    @Param("month") int month);

    Long sumInflowToAsset(@Param("userId") Long userId,
                          @Param("year") int year,
                          @Param("month") int month,
                          @Param("assetSnapshotId") Long assetSnapshotId);

    AssetForCloseDto findAssetForClose(@Param("assetSnapshotId") Long assetSnapshotId);

    void updateAssetBalance(@Param("assetSnapshotId") Long assetSnapshotId,
                            @Param("newBalance") Long newBalance);
}