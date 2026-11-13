package com.growtive.money.service;

import com.growtive.common.exception.BadRequestException;
import com.growtive.common.exception.NotFoundException;
import com.growtive.money.dto.DailyTransactionDto;
import com.growtive.money.mapper.DailyTransactionMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class DailyTransactionServiceImpl implements DailyTransactionService {

    private final DailyTransactionMapper mapper;

    @Override
    @Transactional
    public List<DailyTransactionDto> getMonthlyTransactions(Long userId, int year, int month) {
        ensureRecurringOccurrences(userId, year, month);
        return mapper.findByMonth(userId, year, month);
    }

    @Override
    @Transactional
    public List<DailyTransactionDto> search(Long userId, LocalDate from, LocalDate to,
                                            List<String> categories, String keyword) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new BadRequestException("검색 시작일이 종료일보다 늦습니다.");
        }

        ensureRecurringOccurrencesInRange(userId, from, to);

        List<String> categoryList = categories == null ? null : categories.stream()
                .filter(Objects::nonNull).map(String::trim).filter(s -> !s.isEmpty()).distinct().toList();
        if (categoryList != null && categoryList.isEmpty()) categoryList = null;

        String kw = (keyword == null || keyword.isBlank()) ? null : escapeLike(keyword.trim());

        return mapper.search(userId, from, to, categoryList, kw);
    }

    @Override
    public List<String> getUsedCategories(Long userId) {
        return mapper.findUsedCategories(userId);
    }

    /** LIKE 검색에서 %, _ 를 글자 그대로 찾도록 이스케이프 (MySQL/MariaDB 기본 이스케이프 문자 '\') */
    private static String escapeLike(String s) {
        return s.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }

    /**
     * 검색 기간에 포함된 달들의 반복 occurrence를 미리 만들어 둔다. (캘린더에서 달을 열 때와 같은 동작)
     * - 한 달 안의 기간(월별/주별): 캘린더처럼 그 달을 그대로 보장
     * - 여러 달에 걸친 기간(연별/전체): 미래 달에 반복 항목이 대량 생성되지 않도록 이번 달까지만 보장
     */
    private void ensureRecurringOccurrencesInRange(Long userId, LocalDate from, LocalDate to) {
        YearMonth thisMonth = YearMonth.now();

        YearMonth start;
        if (from != null) {
            start = YearMonth.from(from);
        } else {
            LocalDate earliest = mapper.findEarliestRecurringOriginDate(userId);
            if (earliest == null) return; // 반복 항목이 없으면 할 일 없음
            start = YearMonth.from(earliest);
        }
        YearMonth end = (to != null) ? YearMonth.from(to) : thisMonth;

        if (!start.equals(end) && end.isAfter(thisMonth)) {
            end = thisMonth;
        }
        for (YearMonth ym = start; !ym.isAfter(end); ym = ym.plusMonths(1)) {
            ensureRecurringOccurrences(userId, ym.getYear(), ym.getMonthValue());
        }
    }

    /**
     * 활성 반복 원본 항목 중 이 달에 아직 occurrence가 없는 것을 찾아 생성한다.
     * (financial_node_snapshot의 월별 스냅샷 생성 패턴과 동일한 "조회 시점에 보장" 방식)
     */
    private void ensureRecurringOccurrences(Long userId, int year, int month) {
        YearMonth targetMonth = YearMonth.of(year, month);
        List<DailyTransactionDto> origins = mapper.findActiveRecurringOrigins(userId, targetMonth.atEndOfMonth());

        for (DailyTransactionDto origin : origins) {
            YearMonth originMonth = YearMonth.from(origin.getDate());
            if (!targetMonth.isAfter(originMonth)) {
                continue;
            }
            if (mapper.countOccurrenceForOriginInMonth(origin.getId(), year, month) > 0) {
                continue;
            }

            int day = Math.min(origin.getDate().getDayOfMonth(), targetMonth.lengthOfMonth());
            DailyTransactionDto occurrence = new DailyTransactionDto();
            occurrence.setDate(targetMonth.atDay(day));
            occurrence.setType(origin.getType());
            occurrence.setCategory(origin.getCategory());
            occurrence.setAmount(origin.getAmount());
            occurrence.setMemo(origin.getMemo());
            occurrence.setRecurring(true);
            occurrence.setRecurringOriginId(origin.getId());
            mapper.insert(userId, occurrence);
        }
    }

    @Override
    @Transactional
    public DailyTransactionDto create(Long userId, DailyTransactionDto dto) {
        mapper.insert(userId, dto);
        return dto;
    }

    @Override
    @Transactional
    public DailyTransactionDto update(Long userId, Long id, DailyTransactionDto dto) {
        if (mapper.findById(id, userId) == null) {
            throw new NotFoundException("거래 내역을 찾을 수 없습니다: id=" + id);
        }
        mapper.update(id, userId, dto);
        dto.setId(id);
        return dto;
    }

    @Override
    @Transactional
    public void delete(Long userId, Long id) {
        if (mapper.findById(id, userId) == null) {
            throw new NotFoundException("거래 내역을 찾을 수 없습니다: id=" + id);
        }
        mapper.delete(id, userId);
    }
}
