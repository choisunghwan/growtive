package com.growtive.shared.dto;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;

/** 공유 가계부: 한 날짜의 내역 순서 바꾸기 (ids = 새 순서) */
@Data
public class SharedTransactionOrderDto {
    private LocalDate date;
    private List<Long> ids;
}
