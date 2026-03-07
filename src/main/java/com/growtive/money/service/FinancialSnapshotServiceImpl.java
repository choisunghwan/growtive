package com.growtive.money.service;

import com.growtive.money.dto.MonthlySnapshotUpdateRequestDto;
import com.growtive.money.dto.SnapshotNodeDto;
import com.growtive.money.mapper.FinancialSnapshotMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.YearMonth;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FinancialSnapshotServiceImpl implements FinancialSnapshotService {

    private final FinancialSnapshotMapper mapper;

    /**
     * 현재 월 snapshot 생성 보장
     */
    @Override
    public void createMonthlySnapshotIfNotExists(Long userId) {

        YearMonth now = YearMonth.now();

        createMonthlySnapshotIfNotExists(
                userId,
                now.getYear(),
                now.getMonthValue()
        );
    }

    /**
     * 특정 년/월 snapshot 생성 보장
     *
     * ✔ snapshot 없으면 전체 생성
     * ✔ snapshot 있으면 템플릿 누락 항목만 동기화
     */
    @Override
    @Transactional
    public void createMonthlySnapshotIfNotExists(Long userId, int year, int month) {

        int count = mapper.countSnapshot(userId, year, month);

        if (count == 0) {

            // 1️⃣ Template → Snapshot 전체 복사
            mapper.insertSnapshotFromTemplate(userId, year, month);

            // 2️⃣ 이전 달 ASSET 잔액 복사 (최초 생성 시에만)
            YearMonth current = YearMonth.of(year, month);
            YearMonth prev = current.minusMonths(1);

            mapper.copyPreviousAssetBalance(
                    userId,
                    year,
                    month,
                    prev.getYear(),
                    prev.getMonthValue()
            );

            // 3️⃣ flow_template → flow_snapshot 복사
            mapper.insertFlowSnapshot(userId, year, month);

        } else {

            // 🔥 snapshot 이미 있으면 템플릿 누락 항목만 추가
            mapper.insertMissingSnapshotNodesFromTemplate(userId, year, month);

            // (선택) flow도 누락만 동기화
            mapper.insertMissingFlowSnapshot(userId, year, month);
        }
    }

    /**
     * snapshot 생성 보장 + 금액 업데이트
     */
    @Override
    @Transactional
    public void ensureAndUpdateMonthlySnapshot(
            Long userId,
            MonthlySnapshotUpdateRequestDto request
    ) {

        int year = request.getYear();
        int month = request.getMonth();

        // snapshot 생성 보장
        createMonthlySnapshotIfNotExists(userId, year, month);

        if (request.getNodes() == null) return;

        request.getNodes().forEach(node -> {

            Long amount = (node.getAmount() == null ? 0L : node.getAmount());

            if (node.getSnapshotId() != null) {

                mapper.updateMonthlyAmountBySnapshotId(
                        userId,
                        node.getSnapshotId(),
                        amount
                );

            } else if (node.getName() != null && !node.getName().isBlank()) {

                mapper.updateMonthlyAmountByName(
                        userId,
                        year,
                        month,
                        node.getName(),
                        amount
                );
            }
        });
    }

    /**
     * 특정 월 snapshot 조회
     */
    @Override
    @Transactional(readOnly = true)
    public List<SnapshotNodeDto> getMonthlySnapshotNodes(
            Long userId,
            int year,
            int month
    ) {

        // snapshot 생성 보장
        createMonthlySnapshotIfNotExists(userId, year, month);

        return mapper.findSnapshotNodes(userId, year, month);
    }
}