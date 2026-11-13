package com.growtive.money.service;

import com.growtive.money.dto.DailyTransactionDto;

import java.time.LocalDate;
import java.util.List;

public interface DailyTransactionService {

    List<DailyTransactionDto> getMonthlyTransactions(Long userId, int year, int month);

    /** 기간(from~to, null이면 제한 없음) + 카테고리 + 메모 키워드로 내역 검색 */
    List<DailyTransactionDto> search(Long userId, LocalDate from, LocalDate to,
                                     List<String> categories, String keyword);

    /** 사용자가 사용한 카테고리 목록 */
    List<String> getUsedCategories(Long userId);

    DailyTransactionDto create(Long userId, DailyTransactionDto dto);

    DailyTransactionDto update(Long userId, Long id, DailyTransactionDto dto);

    void delete(Long userId, Long id);
}
