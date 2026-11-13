package com.growtive.shared;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 서버 시작 시 공유 캘린더 테이블이 없으면 만든다. (CREATE TABLE IF NOT EXISTS, 기존 테이블은 건드리지 않음)
 * 실패해도 서버는 뜨고 로그에 직접 실행할 SQL을 남긴다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SharedCalendarTableInitializer implements ApplicationRunner {

    static final List<String> CREATE_SQLS = List.of(
            """
            CREATE TABLE IF NOT EXISTS shared_calendar (
                id         BIGINT      NOT NULL AUTO_INCREMENT,
                name       VARCHAR(50) NOT NULL,
                owner_id   BIGINT      NOT NULL,
                created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) DEFAULT CHARSET = utf8mb4
            """,
            """
            CREATE TABLE IF NOT EXISTS shared_calendar_member (
                calendar_id BIGINT      NOT NULL,
                user_id     BIGINT      NOT NULL,
                status      VARCHAR(10) NOT NULL,
                invited_by  BIGINT      NULL,
                created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (calendar_id, user_id),
                KEY idx_shared_calendar_member_user (user_id)
            ) DEFAULT CHARSET = utf8mb4
            """,
            // 2단계: 공유 가계부
            """
            CREATE TABLE IF NOT EXISTS shared_transaction (
                id                  BIGINT       NOT NULL AUTO_INCREMENT,
                calendar_id         BIGINT       NOT NULL,
                author_id           BIGINT       NULL,
                transaction_date    DATE         NOT NULL,
                type                VARCHAR(10)  NOT NULL,
                category            VARCHAR(50)  NOT NULL,
                amount              BIGINT       NOT NULL,
                memo                VARCHAR(255) NULL,
                is_recurring        BOOLEAN      NOT NULL DEFAULT FALSE,
                recurring_origin_id BIGINT       NULL,
                created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                KEY idx_shared_transaction_cal_date (calendar_id, transaction_date),
                KEY idx_shared_transaction_origin (recurring_origin_id)
            ) DEFAULT CHARSET = utf8mb4
            """,
            // 2단계: 공유 일정
            """
            CREATE TABLE IF NOT EXISTS shared_event (
                id          BIGINT       NOT NULL AUTO_INCREMENT,
                calendar_id BIGINT       NOT NULL,
                author_id   BIGINT       NULL,
                start_date  DATE         NOT NULL,
                end_date    DATE         NOT NULL,
                event_time  TIME         NULL,
                title       VARCHAR(100) NOT NULL,
                memo        VARCHAR(255) NULL,
                color_tag   VARCHAR(20)  NULL,
                created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                KEY idx_shared_event_cal_dates (calendar_id, start_date, end_date)
            ) DEFAULT CHARSET = utf8mb4
            """
    );

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        for (String sql : CREATE_SQLS) {
            try {
                jdbcTemplate.execute(sql);
            } catch (Exception e) {
                log.error("공유 캘린더 테이블을 만들지 못했습니다. 아래 SQL을 DB에서 직접 실행해주세요.\n{}", sql, e);
                return;
            }
        }
        log.info("공유 캘린더 테이블 확인 완료");
    }
}
