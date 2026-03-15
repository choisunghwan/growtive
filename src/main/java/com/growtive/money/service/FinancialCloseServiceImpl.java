package com.growtive.money.service;

import com.growtive.money.dto.AssetSnapshotDto;
import com.growtive.money.mapper.FinancialCloseMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.YearMonth;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FinancialCloseServiceImpl implements FinancialCloseService {

    private final FinancialCloseMapper mapper;
    private final FinancialSnapshotService snapshotService;

    @Override
    @Transactional
    public void closeMonth(Long userId, int year, int month) {

        List<Long> assetIds = mapper.findAssetSnapshotIds(userId, year, month);

        for (Long assetSnapshotId : assetIds) {

            AssetSnapshotDto asset = mapper.findAssetForClose(assetSnapshotId);

            long inflow = mapper.sumInflowToAsset(userId, year, month, assetSnapshotId);

            long currentBalance =
                    asset.getCurrentBalance() == null ? 0L : asset.getCurrentBalance();

            BigDecimal annual =
                    asset.getExpectedAnnualReturn() == null
                            ? BigDecimal.ZERO
                            : asset.getExpectedAnnualReturn();

            BigDecimal monthlyRate = annual
                    .divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_UP)
                    .divide(BigDecimal.valueOf(12), 10, RoundingMode.HALF_UP);

            BigDecimal next = BigDecimal.valueOf(currentBalance)
                    .add(BigDecimal.valueOf(inflow))
                    .multiply(BigDecimal.ONE.add(monthlyRate));

            long newBalance =
                    next.setScale(0, RoundingMode.FLOOR).longValue();

            mapper.updateAssetBalance(assetSnapshotId, newBalance);
        }

        // 🔥 다음달 snapshot 생성
        YearMonth next = YearMonth.of(year, month).plusMonths(1);

        snapshotService.createMonthlySnapshotIfNotExists(
                userId,
                next.getYear(),
                next.getMonthValue()
        );

        // 🔥 월 마감 완료 표시
        mapper.markMonthClosed(userId, year, month);
    }

    @Override
    public boolean isMonthClosed(Long userId, int year, int month) {
        return mapper.isMonthClosed(userId, year, month);
    }
}