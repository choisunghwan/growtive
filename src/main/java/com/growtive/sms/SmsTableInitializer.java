package com.growtive.sms;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 서버 시작 시 📲 문자 자동 입력 테이블이 없으면 만든다. (CREATE TABLE IF NOT EXISTS — 추가만)
 * - sms_link_key: 사람별 연결 키 (키 원문은 저장하지 않고 SHA-256 해시만)
 * - sms_inbox  : 받은 카드 문자와 읽은 결과, 처리 상태 (PENDING 확인 대기 / SAVED 저장 / DISMISSED 버림)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SmsTableInitializer implements ApplicationRunner {

    static final List<String> DDL = List.of(
            """
            CREATE TABLE IF NOT EXISTS sms_link_key (
                user_id      BIGINT      NOT NULL,
                key_hash     CHAR(64)    NOT NULL,
                auto_save    BOOLEAN     NOT NULL DEFAULT FALSE,
                created_at   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
                last_used_at TIMESTAMP   NULL,
                PRIMARY KEY (user_id),
                UNIQUE KEY uk_sms_link_key_hash (key_hash)
            ) DEFAULT CHARSET = utf8mb4
            """,
            """
            CREATE TABLE IF NOT EXISTS sms_inbox (
                id             BIGINT       NOT NULL AUTO_INCREMENT,
                user_id        BIGINT       NOT NULL,
                text_hash      CHAR(64)     NOT NULL,
                raw_text       VARCHAR(2000) NOT NULL,
                is_cancel      BOOLEAN      NOT NULL DEFAULT FALSE,
                amount         BIGINT       NULL,
                merchant       VARCHAR(100) NULL,
                card_name      VARCHAR(50)  NULL,
                installment    VARCHAR(20)  NULL,
                tx_date        DATE         NULL,
                tx_time        TIME         NULL,
                category       VARCHAR(50)  NULL,
                status         VARCHAR(10)  NOT NULL,
                transaction_id BIGINT       NULL,
                created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY uk_sms_inbox_text (user_id, text_hash),
                KEY idx_sms_inbox_status (user_id, status)
            ) DEFAULT CHARSET = utf8mb4
            """
    );

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        for (String sql : DDL) {
            try {
                jdbcTemplate.execute(sql);
            } catch (Exception e) {
                log.error("문자 자동 입력 테이블을 만들지 못했습니다. 아래 SQL을 DB에서 직접 실행해주세요.\n{}", sql, e);
                return;
            }
        }
        log.info("문자 자동 입력 테이블 확인 완료");
    }
}
