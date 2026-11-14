package com.growtive.money.autoincome;

import com.growtive.money.dto.DailyTransactionDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface AutoIncomeMapper {

    /** 이 기간을 처리했다고 기록 (이미 있으면 0 → 이미 넣었거나 사용자가 지운 기간) */
    int insertLogIfAbsent(@Param("userId") Long userId, @Param("periodStart") LocalDate periodStart);

    int setLogTransaction(@Param("userId") Long userId, @Param("periodStart") LocalDate periodStart,
                          @Param("transactionId") Long transactionId);

    /** 이 기간에 자동 기록된 내역 id (지워졌으면 null) */
    Long findLiveTransactionId(@Param("userId") Long userId, @Param("periodStart") LocalDate periodStart);

    /** 기간 안에 같은 카테고리·같은 금액의 다른 수입 내역 (중복 알림용) */
    List<DailyTransactionDto> findSimilarIncome(@Param("userId") Long userId,
                                                @Param("from") LocalDate from, @Param("to") LocalDate to,
                                                @Param("category") String category, @Param("amount") Long amount,
                                                @Param("excludeId") Long excludeId);

    /** 자동 기록된 내역 중 아직 남아 있는 것 개수 / 삭제 (사용자가 끄면서 '지우기'를 고른 경우만) */
    int countLiveEntries(@Param("userId") Long userId);

    int deleteLiveEntries(@Param("userId") Long userId);
}
