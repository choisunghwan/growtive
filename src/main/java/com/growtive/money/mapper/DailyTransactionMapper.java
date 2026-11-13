package com.growtive.money.mapper;

import com.growtive.money.dto.CategoryAmountDto;
import com.growtive.money.dto.DailyTransactionDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface DailyTransactionMapper {

    /** 특정 월 전체 거래 목록 (본인 소유만) */
    List<DailyTransactionDto> findByMonth(@Param("userId") Long userId,
                                          @Param("year") int year,
                                          @Param("month") int month);

    /** 단건 조회 (본인 소유일 때만) */
    DailyTransactionDto findById(@Param("id") Long id, @Param("userId") Long userId);

    int insert(@Param("userId") Long userId, @Param("dto") DailyTransactionDto dto);

    int update(@Param("id") Long id, @Param("userId") Long userId, @Param("dto") DailyTransactionDto dto);

    int delete(@Param("id") Long id, @Param("userId") Long userId);

    /** 특정 월의 INCOME/EXPENSE 합계 (월별 요약 연동용) */
    Long sumByType(@Param("userId") Long userId,
                   @Param("year") int year,
                   @Param("month") int month,
                   @Param("type") String type);

    /** 특정 월의 카테고리별 합계 (돈 흐름도 연동용) */
    List<CategoryAmountDto> sumByCategory(@Param("userId") Long userId,
                                          @Param("year") int year,
                                          @Param("month") int month,
                                          @Param("type") String type);

    /** 활성 상태인 반복 원본(origin) 항목들 (해당 날짜 이전에 시작된 것만) */
    List<DailyTransactionDto> findActiveRecurringOrigins(@Param("userId") Long userId,
                                                         @Param("onOrBefore") LocalDate onOrBefore);

    /** 특정 원본의 occurrence가 그 달에 이미 있는지 개수 확인 */
    int countOccurrenceForOriginInMonth(@Param("originId") Long originId,
                                        @Param("year") int year,
                                        @Param("month") int month);

    /** 내역 검색: from/to/categories/keyword 모두 null 허용 (null이면 조건 없음) */
    List<DailyTransactionDto> search(@Param("userId") Long userId,
                                     @Param("from") LocalDate from,
                                     @Param("to") LocalDate to,
                                     @Param("categories") List<String> categories,
                                     @Param("keyword") String keyword);

    /** 사용자가 사용한 카테고리 (중복 제거, 많이 쓴 순) */
    List<String> findUsedCategories(@Param("userId") Long userId);

    /** 가장 이른 반복 원본 날짜 (전체 기간 검색 시 반복 occurrence 보장 시작점) */
    LocalDate findEarliestRecurringOriginDate(@Param("userId") Long userId);

    /** 친구 캘린더 비교용: 숨긴 항목 제외, sinceDate~untilDate 범위 내만 */
    List<DailyTransactionDto> findVisibleByMonth(@Param("userId") Long userId,
                                                 @Param("year") int year,
                                                 @Param("month") int month,
                                                 @Param("sinceDate") LocalDate sinceDate,
                                                 @Param("untilDate") LocalDate untilDate);
}
