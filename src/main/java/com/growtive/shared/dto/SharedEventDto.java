package com.growtive.shared.dto;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

/** 공유 일정 (개인 ScheduleEventDto와 같은 필드 + 작성자) */
@Data
public class SharedEventDto {
    private Long id;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalTime time;
    private String title;
    private String memo;
    private String colorTag;
    private Long authorId;
    private String authorDisplayName;
}
