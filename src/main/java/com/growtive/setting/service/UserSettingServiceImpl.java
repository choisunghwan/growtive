package com.growtive.setting.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.growtive.common.exception.BadRequestException;
import com.growtive.setting.dto.HistoryPinDto;
import com.growtive.setting.mapper.UserSettingMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserSettingServiceImpl implements UserSettingService {

    static final String HISTORY_PIN_KEY = "history.pin";
    private static final Set<String> UNITS = Set.of("ALL", "YEAR", "MONTH", "WEEK", "CUSTOM");

    private final UserSettingMapper mapper;
    private final ObjectMapper objectMapper;

    @Override
    public HistoryPinDto getHistoryPin(Long userId) {
        String json = mapper.findValue(userId, HISTORY_PIN_KEY);
        if (json == null) return null;
        try {
            HistoryPinDto pin = objectMapper.readValue(json, HistoryPinDto.class);
            validate(pin);
            return pin;
        } catch (JsonProcessingException | BadRequestException e) {
            // 저장된 값이 깨졌으면 핀이 없는 것으로 취급 (화면은 기본값인 이번 달)
            log.warn("잘못된 내역 핀 설정 무시: userId={}, value={}", userId, json);
            return null;
        }
    }

    @Override
    public HistoryPinDto saveHistoryPin(Long userId, HistoryPinDto pin) {
        validate(pin);
        HistoryPinDto clean = "CUSTOM".equals(pin.getUnit())
                ? new HistoryPinDto("CUSTOM", pin.getFrom(), pin.getTo())
                : new HistoryPinDto(pin.getUnit(), null, null);
        try {
            mapper.upsert(userId, HISTORY_PIN_KEY, objectMapper.writeValueAsString(clean));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("핀 설정을 저장하지 못했습니다.", e);
        }
        return clean;
    }

    @Override
    public void clearHistoryPin(Long userId) {
        mapper.delete(userId, HISTORY_PIN_KEY);
    }

    private void validate(HistoryPinDto pin) {
        if (pin == null || pin.getUnit() == null || !UNITS.contains(pin.getUnit())) {
            throw new BadRequestException("기간 단위가 올바르지 않습니다.");
        }
        if (!"CUSTOM".equals(pin.getUnit())) return;
        try {
            LocalDate from = LocalDate.parse(pin.getFrom());
            LocalDate to = LocalDate.parse(pin.getTo());
            if (from.isAfter(to)) throw new BadRequestException("시작일이 종료일보다 늦습니다.");
        } catch (DateTimeParseException | NullPointerException e) {
            throw new BadRequestException("시작일과 종료일을 yyyy-MM-dd 형식으로 입력해주세요.");
        }
    }
}
