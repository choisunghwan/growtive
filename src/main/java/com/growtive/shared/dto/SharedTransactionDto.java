package com.growtive.shared.dto;

import lombok.Data;

import java.time.LocalDate;

/** 공유 가계부 내역 (개인 DailyTransactionDto와 같은 필드 + 작성자) */
@Data
public class SharedTransactionDto {
    private Long id;
    private LocalDate date;
    /** INCOME / EXPENSE */
    private String type;
    private String category;
    private Long amount;
    private String memo;
    /** 매달 반복 (원본: recurringOriginId == null) */
    private boolean recurring;
    private Long recurringOriginId;
    /** 작성자 (처음 입력한 사람) */
    private Long authorId;
    private String authorDisplayName;
}
