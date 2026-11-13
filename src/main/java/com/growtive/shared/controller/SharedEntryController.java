package com.growtive.shared.controller;

import com.growtive.common.exception.UnauthorizedException;
import com.growtive.shared.dto.SharedEventDto;
import com.growtive.shared.dto.SharedTransactionDto;
import com.growtive.shared.dto.SharedTransactionOrderDto;
import com.growtive.shared.service.SharedEntryService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 공유 캘린더 2단계: 함께 쓰는 가계부 / 일정
 * - 경로가 개인용(/api/money/ledger, /api/schedule)과 같은 모양이라 화면 코드를 그대로 재사용
 */
@RestController
@RequestMapping("/api/shared-calendars/{calendarId}")
@RequiredArgsConstructor
public class SharedEntryController {

    private final SharedEntryService service;

    private Long getUserId(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new UnauthorizedException("로그인이 필요합니다.");
        return userId;
    }

    /* ----- 가계부 ----- */

    @GetMapping("/ledger")
    public List<SharedTransactionDto> ledger(@PathVariable Long calendarId, @RequestParam int year,
                                             @RequestParam int month, HttpSession session) {
        return service.getMonthlyTransactions(getUserId(session), calendarId, year, month);
    }

    @PostMapping("/ledger")
    public SharedTransactionDto createTx(@PathVariable Long calendarId, @RequestBody SharedTransactionDto dto,
                                         HttpSession session) {
        return service.createTransaction(getUserId(session), calendarId, dto);
    }

    @PutMapping("/ledger/{id}")
    public SharedTransactionDto updateTx(@PathVariable Long calendarId, @PathVariable Long id,
                                         @RequestBody SharedTransactionDto dto, HttpSession session) {
        return service.updateTransaction(getUserId(session), calendarId, id, dto);
    }

    /** 한 날짜의 내역 순서 바꾸기 (꾹 눌러 끌기) */
    @PutMapping("/ledger/order")
    public void reorderTx(@PathVariable Long calendarId, @RequestBody SharedTransactionOrderDto req, HttpSession session) {
        service.reorderTransactions(getUserId(session), calendarId, req.getDate(), req.getIds());
    }

    @DeleteMapping("/ledger/{id}")
    public void deleteTx(@PathVariable Long calendarId, @PathVariable Long id, HttpSession session) {
        service.deleteTransaction(getUserId(session), calendarId, id);
    }

    /* ----- 일정 ----- */

    @GetMapping("/schedule")
    public List<SharedEventDto> schedule(@PathVariable Long calendarId, @RequestParam int year,
                                         @RequestParam int month, HttpSession session) {
        return service.getMonthlyEvents(getUserId(session), calendarId, year, month);
    }

    @PostMapping("/schedule")
    public SharedEventDto createEvent(@PathVariable Long calendarId, @RequestBody SharedEventDto dto,
                                      HttpSession session) {
        return service.createEvent(getUserId(session), calendarId, dto);
    }

    @PutMapping("/schedule/{id}")
    public SharedEventDto updateEvent(@PathVariable Long calendarId, @PathVariable Long id,
                                      @RequestBody SharedEventDto dto, HttpSession session) {
        return service.updateEvent(getUserId(session), calendarId, id, dto);
    }

    @DeleteMapping("/schedule/{id}")
    public void deleteEvent(@PathVariable Long calendarId, @PathVariable Long id, HttpSession session) {
        service.deleteEvent(getUserId(session), calendarId, id);
    }
}
