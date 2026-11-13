package com.growtive.shared.service;

import com.growtive.common.exception.BadRequestException;
import com.growtive.common.exception.NotFoundException;
import com.growtive.shared.dto.SharedEventDto;
import com.growtive.shared.dto.SharedTransactionDto;
import com.growtive.shared.mapper.SharedEntryMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.YearMonth;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SharedEntryServiceImpl implements SharedEntryService {

    private static final int CATEGORY_MAX = 30;
    private static final int MEMO_MAX = 255;
    private static final int TITLE_MAX = 100;

    private final SharedEntryMapper mapper;
    private final SharedCalendarService calendarService;

    /* ======================= 가계부 ======================= */

    @Override
    @Transactional
    public List<SharedTransactionDto> getMonthlyTransactions(Long userId, Long calendarId, int year, int month) {
        calendarService.requireMember(userId, calendarId);
        ensureRecurringOccurrences(calendarId, year, month);
        return mapper.findTransactionsByMonth(calendarId, year, month);
    }

    /** 개인 가계부와 같은 방식: 그 달을 조회할 때 반복 원본의 occurrence가 없으면 만든다 (작성자는 원본 작성자) */
    private void ensureRecurringOccurrences(Long calendarId, int year, int month) {
        YearMonth target = YearMonth.of(year, month);
        for (SharedTransactionDto origin : mapper.findActiveRecurringOrigins(calendarId, target.atEndOfMonth())) {
            if (!target.isAfter(YearMonth.from(origin.getDate()))) continue;
            if (mapper.countOccurrenceForOriginInMonth(origin.getId(), year, month) > 0) continue;

            int day = Math.min(origin.getDate().getDayOfMonth(), target.lengthOfMonth());
            SharedTransactionDto occ = new SharedTransactionDto();
            occ.setDate(target.atDay(day));
            occ.setType(origin.getType());
            occ.setCategory(origin.getCategory());
            occ.setAmount(origin.getAmount());
            occ.setMemo(origin.getMemo());
            occ.setRecurring(true);
            occ.setRecurringOriginId(origin.getId());
            mapper.insertTransaction(calendarId, origin.getAuthorId(), occ);
        }
    }

    @Override
    @Transactional
    public SharedTransactionDto createTransaction(Long userId, Long calendarId, SharedTransactionDto dto) {
        calendarService.requireMember(userId, calendarId);
        validate(dto);
        dto.setId(null);
        dto.setRecurringOriginId(null); // 새로 입력하는 건 항상 원본
        mapper.insertTransaction(calendarId, userId, dto);
        return mapper.findTransaction(calendarId, dto.getId());
    }

    @Override
    @Transactional
    public SharedTransactionDto updateTransaction(Long userId, Long calendarId, Long id, SharedTransactionDto dto) {
        calendarService.requireMember(userId, calendarId);
        requireTransaction(calendarId, id);
        validate(dto);
        mapper.updateTransaction(calendarId, id, dto);
        return mapper.findTransaction(calendarId, id);
    }

    @Override
    @Transactional
    public void deleteTransaction(Long userId, Long calendarId, Long id) {
        calendarService.requireMember(userId, calendarId);
        requireTransaction(calendarId, id);
        mapper.deleteTransaction(calendarId, id);
    }

    private void requireTransaction(Long calendarId, Long id) {
        if (mapper.findTransaction(calendarId, id) == null) {
            throw new NotFoundException("내역을 찾을 수 없습니다.");
        }
    }

    private void validate(SharedTransactionDto dto) {
        if (dto == null || dto.getDate() == null) throw new BadRequestException("날짜를 입력해주세요.");
        if (!"INCOME".equals(dto.getType()) && !"EXPENSE".equals(dto.getType())) {
            throw new BadRequestException("수입/지출 구분이 올바르지 않습니다.");
        }
        if (dto.getAmount() == null || dto.getAmount() <= 0) throw new BadRequestException("금액을 입력해주세요.");
        String category = dto.getCategory() == null ? "" : dto.getCategory().trim();
        if (category.isEmpty()) throw new BadRequestException("카테고리를 입력해주세요.");
        if (category.length() > CATEGORY_MAX) throw new BadRequestException("카테고리는 " + CATEGORY_MAX + "자 이내로 입력해주세요.");
        dto.setCategory(category);
        if (dto.getMemo() != null && dto.getMemo().length() > MEMO_MAX) {
            throw new BadRequestException("메모는 " + MEMO_MAX + "자 이내로 입력해주세요.");
        }
    }

    /* ======================= 일정 ======================= */

    @Override
    @Transactional(readOnly = true)
    public List<SharedEventDto> getMonthlyEvents(Long userId, Long calendarId, int year, int month) {
        calendarService.requireMember(userId, calendarId);
        YearMonth ym = YearMonth.of(year, month);
        return mapper.findEventsOverlapping(calendarId, ym.atDay(1), ym.atEndOfMonth());
    }

    @Override
    @Transactional
    public SharedEventDto createEvent(Long userId, Long calendarId, SharedEventDto dto) {
        calendarService.requireMember(userId, calendarId);
        validate(dto);
        dto.setId(null);
        mapper.insertEvent(calendarId, userId, dto);
        return mapper.findEvent(calendarId, dto.getId());
    }

    @Override
    @Transactional
    public SharedEventDto updateEvent(Long userId, Long calendarId, Long id, SharedEventDto dto) {
        calendarService.requireMember(userId, calendarId);
        requireEvent(calendarId, id);
        validate(dto);
        mapper.updateEvent(calendarId, id, dto);
        return mapper.findEvent(calendarId, id);
    }

    @Override
    @Transactional
    public void deleteEvent(Long userId, Long calendarId, Long id) {
        calendarService.requireMember(userId, calendarId);
        requireEvent(calendarId, id);
        mapper.deleteEvent(calendarId, id);
    }

    private void requireEvent(Long calendarId, Long id) {
        if (mapper.findEvent(calendarId, id) == null) throw new NotFoundException("일정을 찾을 수 없습니다.");
    }

    private void validate(SharedEventDto dto) {
        if (dto == null || dto.getStartDate() == null || dto.getEndDate() == null) {
            throw new BadRequestException("시작일과 종료일을 입력해주세요.");
        }
        if (dto.getEndDate().isBefore(dto.getStartDate())) throw new BadRequestException("종료일은 시작일보다 빠를 수 없습니다.");
        String title = dto.getTitle() == null ? "" : dto.getTitle().trim();
        if (title.isEmpty()) throw new BadRequestException("일정 제목을 입력해주세요.");
        if (title.length() > TITLE_MAX) throw new BadRequestException("일정 제목은 " + TITLE_MAX + "자 이내로 입력해주세요.");
        dto.setTitle(title);
        if (dto.getMemo() != null && dto.getMemo().length() > MEMO_MAX) {
            throw new BadRequestException("메모는 " + MEMO_MAX + "자 이내로 입력해주세요.");
        }
    }
}
