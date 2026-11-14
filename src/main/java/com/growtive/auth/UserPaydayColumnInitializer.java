package com.growtive.auth;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 서버 시작 시 월급날·월급 금액 설정 컬럼(users)이 없으면 추가한다.
 * - 추가만 한다 (CLAUDE.md 사용자 데이터 보호 규칙): 모두 NULL 허용 → 기존 회원은 값이 없고(NULL),
 *   NULL이면 화면은 예전 방식(매달 1일~말일, 이번 달 '월급' 내역 금액) 그대로 동작한다.
 * - MySQL은 ADD COLUMN IF NOT EXISTS가 없어서 information_schema로 먼저 확인.
 * - 실패해도 서버는 뜨고, 로그에 직접 실행할 SQL을 남긴다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class UserPaydayColumnInitializer implements ApplicationRunner {

    /** 컬럼 이름 → 정의 */
    static final Map<String, String> COLUMNS = new LinkedHashMap<>();
    static {
        COLUMNS.put("pay_rule", "VARCHAR(20) NULL");       // DAY(매달 N일) / LAST_DAY(말일) / NTH_WEEKDAY(N번째 X요일)
        COLUMNS.put("pay_day", "TINYINT NULL");            // DAY: 1~31
        COLUMNS.put("pay_week", "TINYINT NULL");           // NTH_WEEKDAY: 1~4, -1 = 마지막 주
        COLUMNS.put("pay_weekday", "TINYINT NULL");        // NTH_WEEKDAY: 0=일 ~ 6=토
        COLUMNS.put("pay_adjust", "VARCHAR(10) NULL");     // 주말·공휴일이면: BEFORE(전 평일) / AFTER(다음 평일) / KEEP(그대로)
        COLUMNS.put("salary_mode", "VARCHAR(10) NULL");    // LEDGER(가계부 최근 '월급' 내역) / FIXED(고정 금액)
        COLUMNS.put("salary_amount", "BIGINT NULL");       // FIXED일 때 금액 (BUDGET이면 한 달 예산)
        COLUMNS.put("income_type", "VARCHAR(10) NULL");    // SALARY(월급·근무) / ALLOWANCE(용돈·정기 수입) / BUDGET(수입 없음·예산), NULL = SALARY
        COLUMNS.put("income_category", "VARCHAR(20) NULL"); // ALLOWANCE + LEDGER일 때 금액을 가져올 수입 카테고리 (기본 '용돈')
    }

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        StringBuilder failed = new StringBuilder();
        COLUMNS.forEach((name, def) -> {
            String sql = "ALTER TABLE users ADD COLUMN " + name + " " + def;
            try {
                Integer n = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM information_schema.COLUMNS "
                        + "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = ?", Integer.class, name);
                if (n == null || n == 0) {
                    jdbcTemplate.execute(sql);
                    log.info("users.{} 컬럼 추가", name);
                }
            } catch (Exception e) {
                failed.append(sql).append(";\n");
                log.error("users.{} 컬럼을 추가하지 못했습니다.", name, e);
            }
        });
        if (failed.length() > 0) log.error("아래 SQL을 DB에서 직접 실행해주세요.\n{}", failed);
        else log.info("users 월급날 설정 컬럼 확인 완료");
    }
}
