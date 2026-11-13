package com.growtive.setting;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * 서버 시작 시 user_setting 테이블이 없으면 만든다.
 * - 이 프로젝트는 스키마 마이그레이션 도구가 없어서, 새 테이블 하나를 안전하게(IF NOT EXISTS) 추가하는 용도
 * - 기존 테이블은 건드리지 않음. 실패해도 서버는 그대로 뜨고(로그만 남김) 핀 API만 오류가 난다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class UserSettingTableInitializer implements ApplicationRunner {

    static final String CREATE_SQL = """
            CREATE TABLE IF NOT EXISTS user_setting (
                user_id       BIGINT       NOT NULL,
                setting_key   VARCHAR(50)  NOT NULL,
                setting_value VARCHAR(500) NOT NULL,
                updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, setting_key)
            ) DEFAULT CHARSET = utf8mb4
            """;

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        try {
            jdbcTemplate.execute(CREATE_SQL);
            log.info("user_setting 테이블 확인 완료");
        } catch (Exception e) {
            log.error("user_setting 테이블을 만들지 못했습니다. 아래 SQL을 DB에서 직접 실행해주세요.\n{}", CREATE_SQL, e);
        }
    }
}
