package com.growtive.sms;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Mapper
public interface SmsMapper {

    Map<String, Object> findLinkByUser(@Param("userId") Long userId);

    Map<String, Object> findLinkByHash(@Param("keyHash") String keyHash);

    /** 키 새로 만들기/다시 만들기 (예전 키는 바로 막힘) */
    int upsertLink(@Param("userId") Long userId, @Param("keyHash") String keyHash);

    int updateAutoSave(@Param("userId") Long userId, @Param("autoSave") boolean autoSave);

    int touchLink(@Param("userId") Long userId);

    int deleteLink(@Param("userId") Long userId);

    /** 같은 문자는 한 번만 (이미 있으면 0) */
    int insertIgnore(@Param("userId") Long userId, @Param("textHash") String textHash, @Param("p") SmsParser.Parsed p,
                     @Param("rawText") String rawText, @Param("status") String status);

    Long findIdByHash(@Param("userId") Long userId, @Param("textHash") String textHash);

    SmsInboxItem findItem(@Param("userId") Long userId, @Param("id") Long id);

    /** 확인 대기 (최근 30일) */
    List<SmsInboxItem> findPending(@Param("userId") Long userId, @Param("since") LocalDate since);

    int countPending(@Param("userId") Long userId, @Param("since") LocalDate since);

    int markDone(@Param("userId") Long userId, @Param("id") Long id, @Param("status") String status,
                 @Param("transactionId") Long transactionId);

    /** 승인취소에 맞는 원래 내역: 같은 금액 지출, 60일 안, 메모에 가맹점 포함 우선 */
    Map<String, Object> findCancelMatch(@Param("userId") Long userId, @Param("amount") Long amount,
                                        @Param("merchant") String merchant, @Param("from") LocalDate from,
                                        @Param("to") LocalDate to);
}
