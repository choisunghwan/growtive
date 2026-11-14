package com.growtive.sms;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.growtive.common.exception.BadRequestException;
import com.growtive.common.exception.NotFoundException;
import com.growtive.common.exception.UnauthorizedException;
import com.growtive.money.dto.DailyTransactionDto;
import com.growtive.money.mapper.DailyTransactionMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;

/**
 * 📲 카드 결제 문자 자동 입력
 *
 * [받기] POST /api/sms/in  (로그인 없이 — 사람별 연결 키로 확인)
 *   - 아이폰 단축어 / 안드로이드 MacroDroid가 문자 내용을 보냄 (키: ?key= 또는 X-GrowTive-Key 헤더, 본문: 글자 그대로 또는 {"text": "..."})
 *   - 카드 결제 문자가 아니면 무시, 같은 문자는 한 번만
 *   - '바로 입력'이면 개인 가계부에 바로 저장 (승인취소는 항상 확인 대기)
 * [확인 대기함] GET /api/sms/inbox, POST /api/sms/inbox/{id}/save, /dismiss, /delete-original
 * [붙여넣기] POST /api/sms/inbox/paste  (로그인한 사용자가 문자를 붙여넣어 확인 대기함에 넣기)
 * [연결 키] GET/POST/DELETE /api/sms/link, PUT /api/sms/link/settings
 */
@Slf4j
@RestController
@RequestMapping("/api/sms")
@RequiredArgsConstructor
public class SmsController {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private static final SecureRandom RANDOM = new SecureRandom();

    private final SmsMapper mapper;
    private final DailyTransactionMapper transactionMapper;
    private final ObjectMapper objectMapper;

    private Long getUserId(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new UnauthorizedException("로그인이 필요합니다.");
        return userId;
    }

    static String sha256(String s) {
        try {
            byte[] d = MessageDigest.getInstance("SHA-256").digest(s.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : d) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    /* ---------------- 연결 키 ---------------- */

    @GetMapping("/link")
    public Map<String, Object> link(HttpSession session) {
        Map<String, Object> row = mapper.findLinkByUser(getUserId(session));
        Map<String, Object> res = new HashMap<>();
        res.put("exists", row != null);
        if (row != null) {
            res.put("autoSave", toBool(row.get("auto_save")));
            res.put("createdAt", row.get("created_at"));
            res.put("lastUsedAt", row.get("last_used_at"));
        }
        return res;
    }

    /** 새 키 (다시 만들면 예전 키는 바로 막힘). 키 원문은 이 응답에서 한 번만 보여줌 */
    @PostMapping("/link")
    public Map<String, Object> createLink(HttpSession session) {
        Long userId = getUserId(session);
        byte[] buf = new byte[24];
        RANDOM.nextBytes(buf);
        String key = "gt_" + Base64.getUrlEncoder().withoutPadding().encodeToString(buf);
        mapper.upsertLink(userId, sha256(key));
        return Map.of("key", key);
    }

    @Data
    public static class LinkSettings { private boolean autoSave; }

    @PutMapping("/link/settings")
    public void settings(@RequestBody LinkSettings req, HttpSession session) {
        mapper.updateAutoSave(getUserId(session), req.isAutoSave());
    }

    /** 연결 끊기 — 키만 지움 (받아둔 문자·저장한 내역은 그대로) */
    @DeleteMapping("/link")
    public void deleteLink(HttpSession session) {
        mapper.deleteLink(getUserId(session));
    }

    /* ---------------- 받기 (단축어 / MacroDroid) ---------------- */

    @PostMapping("/in")
    public Map<String, Object> receive(@RequestParam(required = false) String key,
                                       @RequestHeader(value = "X-GrowTive-Key", required = false) String headerKey,
                                       @RequestBody(required = false) String body,
                                       HttpServletRequest request) {
        String k = headerKey != null && !headerKey.isBlank() ? headerKey.trim() : (key == null ? null : key.trim());
        if (k == null || k.isEmpty()) throw new UnauthorizedException("연결 키가 없습니다.");
        Map<String, Object> link = mapper.findLinkByHash(sha256(k));
        if (link == null) throw new UnauthorizedException("연결 키가 맞지 않습니다. 마이페이지에서 주소를 다시 확인해주세요.");
        Long userId = ((Number) link.get("user_id")).longValue();
        mapper.touchLink(userId);

        String text = extractText(body, request.getParameter("text"));
        boolean autoSave = toBool(link.get("auto_save"));
        return Map.of("result", accept(userId, text, autoSave));
    }

    /** 본문: 글자 그대로 / {"text": "..."} / text=... */
    private String extractText(String body, String param) {
        if (param != null && !param.isBlank()) return param;
        if (body == null) return null;
        String b = body.trim();
        if (b.startsWith("{")) {
            try {
                JsonNode n = objectMapper.readTree(b);
                for (String f : List.of("text", "message", "body", "content")) {
                    if (n.hasNonNull(f)) return n.get(f).asText();
                }
            } catch (Exception ignored) { /* 그냥 글자로 처리 */ }
        }
        return b;
    }

    /** @return saved(바로 저장) / pending(확인 대기) / duplicate(이미 받은 문자) / ignored(카드 결제 문자 아님) */
    @Transactional
    String accept(Long userId, String text, boolean autoSave) {
        if (text == null || text.isBlank()) return "ignored";
        String raw = text.length() > 2000 ? text.substring(0, 2000) : text;
        SmsParser.Parsed p = SmsParser.parse(raw);
        if (p == null) return "ignored";
        String hash = sha256(raw.trim());
        boolean saveNow = autoSave && !p.isCancel();
        if (mapper.insertIgnore(userId, hash, p, raw, "PENDING") == 0) return "duplicate";
        if (!saveNow) return "pending";

        Long id = mapper.findIdByHash(userId, hash);
        DailyTransactionDto tx = toTransaction(p.getDate(), p.getCategory(), p.getAmount(), memoOf(p.getMerchant(), p.getCardName()));
        transactionMapper.insert(userId, tx);
        mapper.markDone(userId, id, "SAVED", tx.getId());
        return "saved";
    }

    static String memoOf(String merchant, String cardName) {
        String m = merchant == null ? "" : merchant;
        if (cardName != null) m = m.isEmpty() ? cardName : m + " · " + cardName;
        return m.length() > 255 ? m.substring(0, 255) : m;
    }

    private static DailyTransactionDto toTransaction(LocalDate date, String category, long amount, String memo) {
        DailyTransactionDto tx = new DailyTransactionDto();
        tx.setDate(date);
        tx.setType("EXPENSE");
        tx.setCategory(category == null || category.isBlank() ? "기타" : category);
        tx.setAmount(amount);
        tx.setMemo(memo);
        tx.setRecurring(false);
        return tx;
    }

    /* ---------------- 확인 대기함 ---------------- */

    @GetMapping("/inbox")
    public List<SmsInboxItem> inbox(HttpSession session) {
        Long userId = getUserId(session);
        List<SmsInboxItem> list = mapper.findPending(userId, LocalDate.now(KST).minusDays(30));
        for (SmsInboxItem it : list) {
            if (!it.isCancel() || it.getAmount() == null) continue;
            LocalDate d = it.getTxDate() == null ? LocalDate.now(KST) : it.getTxDate();
            Map<String, Object> m = mapper.findCancelMatch(userId, it.getAmount(), it.getMerchant(), d.minusDays(60), d);
            if (m != null) {
                it.setMatchTransactionId(((Number) m.get("id")).longValue());
                Object md = m.get("date");
                it.setMatchDate(md instanceof java.sql.Date sd ? sd.toLocalDate() : md instanceof LocalDate ld ? ld : null);
                it.setMatchMemo((String) m.get("memo"));
            }
        }
        return list;
    }

    @GetMapping("/inbox/count")
    public Map<String, Object> inboxCount(HttpSession session) {
        return Map.of("count", mapper.countPending(getUserId(session), LocalDate.now(KST).minusDays(30)));
    }

    @Data
    public static class SaveRequest {
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        private LocalDate date;
        private String category;
        private Long amount;
        private String memo;
    }

    /** 확인하고 저장 (금액·카테고리·메모를 고쳐서 저장 가능) */
    @PostMapping("/inbox/{id}/save")
    @Transactional
    public Map<String, Object> save(@PathVariable Long id, @RequestBody SaveRequest req, HttpSession session) {
        Long userId = getUserId(session);
        SmsInboxItem it = pendingItem(userId, id);
        long amount = req.getAmount() != null ? req.getAmount() : (it.getAmount() == null ? 0 : it.getAmount());
        if (amount <= 0 || amount > 100_000_000L) throw new BadRequestException("금액을 확인해주세요.");
        LocalDate date = req.getDate() != null ? req.getDate() : it.getTxDate();
        String memo = req.getMemo() != null ? req.getMemo().trim() : memoOf(it.getMerchant(), it.getCardName());
        if (memo.length() > 255) memo = memo.substring(0, 255);
        String category = req.getCategory() != null && !req.getCategory().isBlank() ? req.getCategory().trim() : it.getCategory();
        if (category != null && category.length() > 50) throw new BadRequestException("카테고리 이름이 너무 깁니다.");
        DailyTransactionDto tx = toTransaction(date, category, amount, memo);
        transactionMapper.insert(userId, tx);
        mapper.markDone(userId, id, "SAVED", tx.getId());
        return Map.of("transactionId", tx.getId());
    }

    /** 버리기 (가계부에 넣지 않음) */
    @PostMapping("/inbox/{id}/dismiss")
    public void dismiss(@PathVariable Long id, HttpSession session) {
        Long userId = getUserId(session);
        pendingItem(userId, id);
        mapper.markDone(userId, id, "DISMISSED", null);
    }

    /** 승인취소: 사용자가 확인하고 원래 내역을 지움 */
    @PostMapping("/inbox/{id}/delete-original")
    @Transactional
    public void deleteOriginal(@PathVariable Long id, @RequestParam Long transactionId, HttpSession session) {
        Long userId = getUserId(session);
        SmsInboxItem it = pendingItem(userId, id);
        if (!it.isCancel()) throw new BadRequestException("승인취소 문자가 아닙니다.");
        if (transactionMapper.findById(transactionId, userId) == null) throw new NotFoundException("원래 내역을 찾을 수 없습니다.");
        transactionMapper.delete(transactionId, userId);
        mapper.markDone(userId, id, "SAVED", transactionId);
    }

    @Data
    public static class PasteRequest { private String text; }

    /** 문자 붙여넣기 → 확인 대기함 (여러 문자를 한 번에 붙여넣으면 빈 줄 두 개 또는 [Web발신] 기준으로 나눔) */
    @PostMapping("/inbox/paste")
    public Map<String, Object> paste(@RequestBody PasteRequest req, HttpSession session) {
        Long userId = getUserId(session);
        if (req.getText() == null || req.getText().isBlank()) throw new BadRequestException("문자 내용을 붙여넣어주세요.");
        if (req.getText().length() > 20000) throw new BadRequestException("한 번에 붙여넣을 수 있는 양을 넘었어요.");
        String[] parts = req.getText().replace("\r", "").split("\\n\\s*\\n\\s*\\n|(?=\\[Web발신])");
        int pending = 0, duplicate = 0, ignored = 0;
        for (String part : parts) {
            switch (accept(userId, part.trim(), false)) {
                case "pending" -> pending++;
                case "duplicate" -> duplicate++;
                default -> ignored++;
            }
        }
        return Map.of("pending", pending, "duplicate", duplicate, "ignored", ignored);
    }

    private SmsInboxItem pendingItem(Long userId, Long id) {
        SmsInboxItem it = mapper.findItem(userId, id);
        if (it == null) throw new NotFoundException("문자를 찾을 수 없습니다.");
        if (!"PENDING".equals(it.getStatus())) throw new BadRequestException("이미 처리한 문자예요.");
        return it;
    }

    private static boolean toBool(Object o) {
        if (o instanceof Boolean b) return b;
        if (o instanceof Number n) return n.intValue() != 0;
        return o != null && "true".equalsIgnoreCase(o.toString());
    }
}
