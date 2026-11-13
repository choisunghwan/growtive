package com.growtive.setting.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 재무 대시보드 > 내역의 📌 기본 기간 핀
 * - unit: ALL / YEAR / MONTH / WEEK / CUSTOM
 * - from, to: CUSTOM(사용자 입력)일 때만 사용 (yyyy-MM-dd)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HistoryPinDto {
    private String unit;
    private String from;
    private String to;
}
