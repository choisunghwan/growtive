package com.growtive.shared.service;

import com.growtive.shared.dto.SharedEventDto;
import com.growtive.shared.dto.SharedTransactionDto;

import java.util.List;

/** 공유 캘린더의 가계부/일정 — 참여 중인 멤버 누구나 조회·입력·수정·삭제 */
public interface SharedEntryService {

    List<SharedTransactionDto> getMonthlyTransactions(Long userId, Long calendarId, int year, int month);

    SharedTransactionDto createTransaction(Long userId, Long calendarId, SharedTransactionDto dto);

    SharedTransactionDto updateTransaction(Long userId, Long calendarId, Long id, SharedTransactionDto dto);

    void deleteTransaction(Long userId, Long calendarId, Long id);

    List<SharedEventDto> getMonthlyEvents(Long userId, Long calendarId, int year, int month);

    SharedEventDto createEvent(Long userId, Long calendarId, SharedEventDto dto);

    SharedEventDto updateEvent(Long userId, Long calendarId, Long id, SharedEventDto dto);

    void deleteEvent(Long userId, Long calendarId, Long id);
}
