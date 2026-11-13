package com.growtive.shared.mapper;

import com.growtive.shared.dto.SharedEventDto;
import com.growtive.shared.dto.SharedTransactionDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

/**
 * 공유 캘린더의 가계부(shared_transaction) / 일정(shared_event)
 * 모든 단건 조회·수정·삭제는 calendar_id + id 를 함께 조건으로 걸어 다른 캘린더 데이터를 건드릴 수 없게 한다.
 */
@Mapper
public interface SharedEntryMapper {

    /* ----- 가계부 ----- */
    List<SharedTransactionDto> findTransactionsByMonth(@Param("calendarId") Long calendarId,
                                                       @Param("year") int year, @Param("month") int month);

    SharedTransactionDto findTransaction(@Param("calendarId") Long calendarId, @Param("id") Long id);

    int insertTransaction(@Param("calendarId") Long calendarId, @Param("authorId") Long authorId,
                          @Param("dto") SharedTransactionDto dto);

    int updateTransaction(@Param("calendarId") Long calendarId, @Param("id") Long id,
                          @Param("dto") SharedTransactionDto dto);

    int deleteTransaction(@Param("calendarId") Long calendarId, @Param("id") Long id);

    List<SharedTransactionDto> findActiveRecurringOrigins(@Param("calendarId") Long calendarId,
                                                          @Param("onOrBefore") LocalDate onOrBefore);

    int countOccurrenceForOriginInMonth(@Param("originId") Long originId,
                                        @Param("year") int year, @Param("month") int month);

    /* ----- 일정 ----- */
    List<SharedEventDto> findEventsOverlapping(@Param("calendarId") Long calendarId,
                                               @Param("monthStart") LocalDate monthStart,
                                               @Param("monthEnd") LocalDate monthEnd);

    SharedEventDto findEvent(@Param("calendarId") Long calendarId, @Param("id") Long id);

    int insertEvent(@Param("calendarId") Long calendarId, @Param("authorId") Long authorId,
                    @Param("dto") SharedEventDto dto);

    int updateEvent(@Param("calendarId") Long calendarId, @Param("id") Long id, @Param("dto") SharedEventDto dto);

    int deleteEvent(@Param("calendarId") Long calendarId, @Param("id") Long id);

    /* ----- 캘린더 삭제 시 ----- */
    int deleteAllTransactionsOfCalendar(@Param("calendarId") Long calendarId);

    int deleteAllEventsOfCalendar(@Param("calendarId") Long calendarId);
}
