package com.growtive.auth;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * 서버 시작 시 users.nickname 컬럼과 유니크 인덱스가 없으면 추가한다.
 * - 추가만 한다 (CLAUDE.md 사용자 데이터 보호 규칙): NULL 허용 새 컬럼 → 기존 회원 데이터는 그대로,
 *   닉네임이 없는(NULL) 회원은 화면에서 기존 이름(display_name)을 대신 보여준다.
 * - MySQL은 ADD COLUMN IF NOT EXISTS가 없어서 information_schema로 먼저 확인.
 * - 실패해도 서버는 뜨고, 로그에 직접 실행할 SQL을 남긴다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class UserNicknameColumnInitializer implements ApplicationRunner {

    static final String ADD_COLUMN = "ALTER TABLE users ADD COLUMN nickname VARCHAR(30) NULL";
    static final String ADD_INDEX = "ALTER TABLE users ADD UNIQUE INDEX uk_users_nickname (nickname)";

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        try {
            if (count("SELECT COUNT(*) FROM information_schema.COLUMNS "
                    + "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'nickname'") == 0) {
                jdbcTemplate.execute(ADD_COLUMN);
                log.info("users.nickname 컬럼 추가");
            }
            if (count("SELECT COUNT(*) FROM information_schema.STATISTICS "
                    + "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND INDEX_NAME = 'uk_users_nickname'") == 0) {
                jdbcTemplate.execute(ADD_INDEX);
                log.info("users.nickname 유니크 인덱스 추가");
            }
            log.info("users.nickname 확인 완료");
        } catch (Exception e) {
            log.error("users.nickname 컬럼/인덱스를 추가하지 못했습니다. 아래 SQL을 DB에서 직접 실행해주세요.\n{};\n{};",
                    ADD_COLUMN, ADD_INDEX, e);
        }
    }

    private int count(String sql) {
        Integer n = jdbcTemplate.queryForObject(sql, Integer.class);
        return n == null ? 0 : n;
    }
}
