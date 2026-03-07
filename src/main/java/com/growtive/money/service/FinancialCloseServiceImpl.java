package com.growtive.money.service;

import com.growtive.money.dto.AssetForCloseDto;
import com.growtive.money.mapper.FinancialCloseMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FinancialCloseServiceImpl implements FinancialCloseService {

    private final FinancialCloseMapper mapper;

    @Override
    public void closeMonth(String userId, int year, int month) {

        // 🔥 userId 타입이 String 기반
        List<Long> assetIds = mapper.findAssetSnapshotIds(userId, year, month);

        for (Long assetSnapshotId : assetIds) {

            AssetForCloseDto asset = mapper.findAssetForClose(assetSnapshotId);

            // inflow 합산 시에도 userId = String 적용
            long inflow = mapper.sumInflowToAsset(userId, year, month, assetSnapshotId);

            long currentBalance = asset.getCurrentBalance() == null ? 0L : asset.getCurrentBalance();

            BigDecimal annual = asset.getExpectedAnnualReturn() == null
                    ? BigDecimal.ZERO
                    : asset.getExpectedAnnualReturn();

            BigDecimal monthlyRate = annual
                    .divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_UP)
                    .divide(BigDecimal.valueOf(12), 10, RoundingMode.HALF_UP);

            BigDecimal next = BigDecimal.valueOf(currentBalance)
                    .add(BigDecimal.valueOf(inflow))
                    .multiply(BigDecimal.ONE.add(monthlyRate));

            long newBalance = next.setScale(0, RoundingMode.FLOOR).longValue();

            mapper.updateAssetBalance(assetSnapshotId, newBalance);
        }
    }
}