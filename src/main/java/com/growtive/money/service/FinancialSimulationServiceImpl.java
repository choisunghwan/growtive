package com.growtive.money.service;

import com.growtive.money.dto.*;
import com.growtive.money.mapper.FinancialSimulationMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
@RequiredArgsConstructor
public class FinancialSimulationServiceImpl implements FinancialSimulationService {

    private final FinancialSimulationMapper mapper;

    /**
     * 내부 목표 도달 시뮬레이션 (추가 투자 옵션 포함) - ✅ 스냅샷 기반
     */
    private int simulateGoalInternal(Long userId,
                                     int startYear,
                                     int startMonth,
                                     long target,
                                     long extraMonthlyInvestment) {

        // ✅ 자산 스냅샷 기반으로 읽음 (current_balance 포함)
        List<AssetForCloseDto> assets = mapper.findAssetSnapshots(userId, startYear, startMonth);

        if (assets == null || assets.isEmpty()) {
            throw new IllegalStateException("ASSET 스냅샷이 없습니다. 템플릿에서 ASSET을 추가한 뒤 대시보드에서 스냅샷을 생성하세요.");
        }

        // ✅ 시작 잔액은 snapshot.current_balance
        Map<Long, Long> balances = new HashMap<>();
        for (AssetForCloseDto asset : assets) {
            Long startBalance = asset.getCurrentBalance() == null ? 0L : asset.getCurrentBalance();
            balances.put(asset.getId(), startBalance);
        }

        int year = startYear;
        int month = startMonth;
        int count = 0;

        while (count < 1200) {

            long total = 0;

            for (int i = 0; i < assets.size(); i++) {

                AssetForCloseDto asset = assets.get(i);

                // ✅ 해당 월 스냅샷의 flow_snapshot 기준 유입 합산
                long inflow = mapper.sumMonthlyInflowToAssetSnapshot(userId, year, month, asset.getId());

                // 추가 투자(첫 자산에 몰빵 - 기존 로직 유지)
                if (extraMonthlyInvestment > 0 && i == 0) {
                    inflow += extraMonthlyInvestment;
                }

                long currentBalance = balances.getOrDefault(asset.getId(), 0L);

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

                balances.put(asset.getId(), newBalance);
                total += newBalance;
            }

            count++;

            if (total >= target) {
                return count;
            }

            // 다음 달로 이동
            month++;
            if (month > 12) {
                month = 1;
                year++;
            }
        }

        throw new IllegalStateException("1200개월 이내 목표 도달 불가");
    }

    /**
     * 기본 월별 시뮬레이션 - ✅ 스냅샷 기반
     */
    @Override
    public SimulationResponseDto simulate(Long userId,
                                          int startYear,
                                          int startMonth,
                                          int months) {

        List<AssetForCloseDto> assets = mapper.findAssetSnapshots(userId, startYear, startMonth);

        if (assets == null || assets.isEmpty()) {
            return new SimulationResponseDto(
                    startYear + "-" + String.format("%02d", startMonth),
                    0,
                    0L,
                    Collections.emptyList()
            );
        }

        Map<Long, Long> balances = new HashMap<>();
        for (AssetForCloseDto asset : assets) {
            Long startBalance = asset.getCurrentBalance() == null ? 0L : asset.getCurrentBalance();
            balances.put(asset.getId(), startBalance);
        }

        List<MonthlySimulationResult> results = new ArrayList<>();

        int year = startYear;
        int month = startMonth;

        for (int i = 0; i < months; i++) {

            long total = 0;

            for (AssetForCloseDto asset : assets) {

                long inflow = mapper.sumMonthlyInflowToAssetSnapshot(userId, year, month, asset.getId());
                long currentBalance = balances.getOrDefault(asset.getId(), 0L);

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

                balances.put(asset.getId(), newBalance);
                total += newBalance;
            }

            results.add(new MonthlySimulationResult(year, month, total));

            month++;
            if (month > 12) {
                month = 1;
                year++;
            }
        }

        long finalTotal = results.isEmpty() ? 0L : results.get(results.size() - 1).getTotalAsset();

        return new SimulationResponseDto(
                startYear + "-" + String.format("%02d", startMonth),
                months,
                finalTotal,
                results
        );
    }

    /**
     * 목표 도달 시점 계산 - ✅ 스냅샷 기반
     */
    @Override
    public GoalSimulationResponseDto simulateUntilGoal(Long userId,
                                                       int startYear,
                                                       int startMonth,
                                                       long target) {

        int monthsRequired = simulateGoalInternal(userId, startYear, startMonth, target, 0);

        int year = startYear;
        int month = startMonth;

        for (int i = 1; i < monthsRequired; i++) {
            month++;
            if (month > 12) {
                month = 1;
                year++;
            }
        }

        return new GoalSimulationResponseDto(
                target,
                year,
                month,
                monthsRequired
        );
    }

    /**
     * 추가 투자 비교 - ✅ 스냅샷 기반
     */
    @Override
    public GoalCompareResponseDto compareGoalWithExtraInvestment(Long userId,
                                                                 int startYear,
                                                                 int startMonth,
                                                                 long target,
                                                                 long monthlyIncrease) {

        int originalMonths = simulateGoalInternal(userId, startYear, startMonth, target, 0);
        int improvedMonths = simulateGoalInternal(userId, startYear, startMonth, target, monthlyIncrease);

        int saved = originalMonths - improvedMonths;

        int year = startYear;
        int month = startMonth;

        for (int i = 1; i < improvedMonths; i++) {
            month++;
            if (month > 12) {
                month = 1;
                year++;
            }
        }

        return new GoalCompareResponseDto(
                target,
                originalMonths,
                improvedMonths,
                saved,
                year,
                month
        );
    }

    /**
     * 📈 차트용 (기본 + 추가 투자 비교선 포함) - ✅ 스냅샷 기반
     */
    @Override
    public ChartResponseDto buildChart(Long userId,
                                       int startYear,
                                       int startMonth,
                                       int months,
                                       long target) {

        List<AssetForCloseDto> assets = mapper.findAssetSnapshots(userId, startYear, startMonth);

        if (assets == null || assets.isEmpty()) {
            return new ChartResponseDto(
                    Collections.emptyList(),
                    Collections.emptyList(),
                    Collections.emptyList(),
                    Collections.emptyList()
            );
        }

        Map<Long, Long> baseBalances = new HashMap<>();
        Map<Long, Long> extraBalances = new HashMap<>();

        for (AssetForCloseDto asset : assets) {
            Long startBalance = asset.getCurrentBalance() == null ? 0L : asset.getCurrentBalance();
            baseBalances.put(asset.getId(), startBalance);
            extraBalances.put(asset.getId(), startBalance);
        }

        List<String> labels = new ArrayList<>();
        List<Long> baseSeries = new ArrayList<>();
        List<Long> extraSeries = new ArrayList<>();
        List<Long> targetLine = new ArrayList<>();

        int year = startYear;
        int month = startMonth;

        long extraMonthlyInvestment = 200_000L;

        for (int i = 0; i < months; i++) {

            long baseTotal = 0;
            long extraTotal = 0;

            for (int j = 0; j < assets.size(); j++) {

                AssetForCloseDto asset = assets.get(j);

                long inflow = mapper.sumMonthlyInflowToAssetSnapshot(userId, year, month, asset.getId());

                BigDecimal annual = asset.getExpectedAnnualReturn() == null
                        ? BigDecimal.ZERO
                        : asset.getExpectedAnnualReturn();

                BigDecimal monthlyRate = annual
                        .divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_UP)
                        .divide(BigDecimal.valueOf(12), 10, RoundingMode.HALF_UP);

                // ===== 기본 =====
                long baseCurrent = baseBalances.getOrDefault(asset.getId(), 0L);
                BigDecimal baseNext = BigDecimal.valueOf(baseCurrent)
                        .add(BigDecimal.valueOf(inflow))
                        .multiply(BigDecimal.ONE.add(monthlyRate));

                long baseNew = baseNext.setScale(0, RoundingMode.FLOOR).longValue();
                baseBalances.put(asset.getId(), baseNew);
                baseTotal += baseNew;

                // ===== 추가 투자 =====
                long extraCurrent = extraBalances.getOrDefault(asset.getId(), 0L);
                long extraInflow = inflow;

                if (j == 0) {
                    extraInflow += extraMonthlyInvestment;
                }

                BigDecimal extraNext = BigDecimal.valueOf(extraCurrent)
                        .add(BigDecimal.valueOf(extraInflow))
                        .multiply(BigDecimal.ONE.add(monthlyRate));

                long extraNew = extraNext.setScale(0, RoundingMode.FLOOR).longValue();
                extraBalances.put(asset.getId(), extraNew);
                extraTotal += extraNew;
            }

            labels.add(year + "-" + String.format("%02d", month));
            baseSeries.add(baseTotal);
            extraSeries.add(extraTotal);
            targetLine.add(target);

            month++;
            if (month > 12) {
                month = 1;
                year++;
            }
        }

        return new ChartResponseDto(labels, baseSeries, extraSeries, targetLine);
    }
}