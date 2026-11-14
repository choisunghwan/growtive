package com.growtive.money.autoincome;

import com.growtive.auth.mapper.AuthMapper;
import com.growtive.common.exception.BadRequestException;
import com.growtive.common.exception.UnauthorizedException;
import com.growtive.money.dto.DailyTransactionDto;
import com.growtive.money.mapper.DailyTransactionMapper;
import com.growtive.user.model.User;
import jakarta.servlet.http.HttpSession;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 💵 고정 금액 자동 기록 (마이페이지 › 상단 게이지 설정 › 고정 금액)
 * - 시작일(월급날·용돈 받는 날)마다 그 금액을 개인 가계부 수입으로 한 번 넣는다
 * - 기간마다 auto_income_log에 기록 → 같은 기간에 두 번 넣지 않고, 사용자가 지운 내역은 다시 넣지 않음
 * - 설정을 켠 날(auto_income_from) 이전 기간은 소급하지 않음
 * - 같은 카테고리·금액 내역이 이미 있으면 그대로 넣되 알려줌 (사용자가 정리)
 */
@RestController
@RequestMapping("/api/money/auto-income")
@RequiredArgsConstructor
public class AutoIncomeController {

    private final AutoIncomeMapper mapper;
    private final AuthMapper authMapper;
    private final DailyTransactionMapper transactionMapper;

    private Long getUserId(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new UnauthorizedException("로그인이 필요합니다.");
        return userId;
    }

    @Data
    public static class EnsureRequest {
        /** 지금 기간의 시작일 (화면에서 월급날 규칙·공휴일로 계산) */
        private LocalDate periodStart;
        /** 다음 시작일 전날 (중복 알림 범위) */
        private LocalDate periodEnd;
    }

    /** 지금 기간의 자동 기록을 보장 (앱을 열 때 상단 게이지가 호출) */
    @PostMapping("/ensure")
    @Transactional
    public Map<String, Object> ensure(@RequestBody EnsureRequest req, HttpSession session) {
        Long userId = getUserId(session);
        Map<String, Object> res = new HashMap<>();
        User user = authMapper.findById(userId);
        if (user == null || !"FIXED".equals(user.getSalaryMode()) || user.getAutoIncomeFrom() == null
                || user.getSalaryAmount() == null || req.getPeriodStart() == null) {
            return res; // 자동 기록 안 함
        }
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
        LocalDate start = req.getPeriodStart();
        LocalDate end = req.getPeriodEnd() == null || req.getPeriodEnd().isBefore(start) ? start : req.getPeriodEnd();
        if (start.isAfter(today.plusDays(1)) || start.isBefore(today.minusDays(70))) {
            throw new BadRequestException("기간을 확인해주세요.");
        }
        // 설정을 켜기 전 기간은 소급하지 않음
        if (start.isBefore(user.getAutoIncomeFrom())) {
            res.put("transactionId", mapper.findLiveTransactionId(userId, start));
            return res;
        }

        boolean created = false;
        if (mapper.insertLogIfAbsent(userId, start) == 1) {
            DailyTransactionDto tx = new DailyTransactionDto();
            tx.setDate(start);
            tx.setType("INCOME");
            tx.setCategory(user.getIncomeCategory() == null ? "용돈" : user.getIncomeCategory());
            tx.setAmount(user.getSalaryAmount());
            tx.setMemo("자동 기록");
            tx.setRecurring(false);
            transactionMapper.insert(userId, tx);
            mapper.setLogTransaction(userId, start, tx.getId());
            created = true;
        }
        Long txId = mapper.findLiveTransactionId(userId, start);
        res.put("transactionId", txId);
        res.put("created", created);
        if (created && txId != null) {
            List<DailyTransactionDto> similar = mapper.findSimilarIncome(userId, start.minusDays(3), end,
                    user.getIncomeCategory() == null ? "용돈" : user.getIncomeCategory(), user.getSalaryAmount(), txId);
            res.put("duplicates", similar);
        }
        return res;
    }

    /** 자동 기록된 내역 중 남아 있는 개수 (끌 때 '지울지' 물어보기 전에) */
    @GetMapping("/entries/count")
    public Map<String, Object> count(HttpSession session) {
        return Map.of("count", mapper.countLiveEntries(getUserId(session)));
    }

    /** 자동 기록된 내역 모두 지우기 — 사용자가 자동 기록을 끄면서 '지우기'를 고른 경우만 */
    @DeleteMapping("/entries")
    @Transactional
    public Map<String, Object> deleteEntries(HttpSession session) {
        return Map.of("deleted", mapper.deleteLiveEntries(getUserId(session)));
    }
}
