package com.growtive.sms;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/** 확인 대기함 한 건 */
@Data
public class SmsInboxItem {
    private Long id;
    private String rawText;
    private boolean cancel;
    private Long amount;
    private String merchant;
    private String cardName;
    private String installment;
    private LocalDate txDate;
    private LocalTime txTime;
    private String category;
    private String status;
    private Long transactionId;
    private LocalDateTime createdAt;
    /** 승인취소 문자일 때: 지울 후보인 원래 내역 */
    private Long matchTransactionId;
    private LocalDate matchDate;
    private String matchMemo;
}
