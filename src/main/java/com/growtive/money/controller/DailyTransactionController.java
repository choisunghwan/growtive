package com.growtive.money.controller;

import com.growtive.common.exception.UnauthorizedException;
import com.growtive.money.dto.DailyTransactionDto;
import com.growtive.money.service.DailyTransactionService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/money/ledger")
@RequiredArgsConstructor
public class DailyTransactionController {

    private final DailyTransactionService service;

    private Long getUserId(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new UnauthorizedException("로그인이 필요합니다.");
        return userId;
    }

    @GetMapping
    public List<DailyTransactionDto> list(@RequestParam int year,
                                          @RequestParam int month,
                                          HttpSession session) {
        return service.getMonthlyTransactions(getUserId(session), year, month);
    }

    /**
     * 내역 검색 (재무 대시보드 > 내역)
     * - from/to: 기간 (둘 다 없으면 전체 기간)
     * - categories: 선택한 카테고리들 (없으면 전체)
     * - keyword: 메모(내용) 부분 일치 검색 (없으면 조건 없음)
     */
    @GetMapping("/search")
    public List<DailyTransactionDto> search(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) List<String> categories,
            @RequestParam(required = false) String keyword,
            HttpSession session) {
        return service.search(getUserId(session), from, to, categories, keyword);
    }

    /** 사용자가 지금까지 사용한 카테고리 목록 (검색 모달용) */
    @GetMapping("/categories")
    public List<String> categories(HttpSession session) {
        return service.getUsedCategories(getUserId(session));
    }

    @PostMapping
    public DailyTransactionDto create(@RequestBody DailyTransactionDto dto, HttpSession session) {
        return service.create(getUserId(session), dto);
    }

    @PutMapping("/{id}")
    public DailyTransactionDto update(@PathVariable Long id,
                                      @RequestBody DailyTransactionDto dto,
                                      HttpSession session) {
        return service.update(getUserId(session), id, dto);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id, HttpSession session) {
        service.delete(getUserId(session), id);
    }
}
