package com.growtive.setting.service;

import com.growtive.setting.dto.HistoryPinDto;

public interface UserSettingService {

    /** 저장된 내역 기본 기간 핀 (없으면 null) */
    HistoryPinDto getHistoryPin(Long userId);

    HistoryPinDto saveHistoryPin(Long userId, HistoryPinDto pin);

    void clearHistoryPin(Long userId);
}
