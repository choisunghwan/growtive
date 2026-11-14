package com.growtive.sms;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 📲 카드 결제 문자 읽기
 * - 국내 카드사 승인/취소 문자에서 금액·가맹점·날짜·시간·카드·할부를 뽑는다
 * - 카드 결제 문자가 아니면(인증번호, 광고, 입금 알림 등) null
 * - 카드사마다 줄 순서·띄어쓰기가 달라서 '알려진 조각'(카드, 이름, 금액, 날짜, 누적·잔액)을 지우고 남는 글자를 가맹점으로 본다
 */
public final class SmsParser {

    private SmsParser() {}

    @Data
    public static class Parsed {
        private boolean cancel;          // 승인취소
        private long amount;
        private String merchant;         // 가맹점 (못 찾으면 null)
        private String cardName;         // 예: 신한카드, KB국민체크
        private String installment;      // 일시불 / 3개월 (없으면 null)
        private LocalDate date;
        private LocalTime time;          // 없으면 null
        private String category;         // 가맹점으로 추측한 카테고리
    }

    private static final Pattern CARD = Pattern.compile(
            "(KB국민|국민|신한|삼성|현대|롯데|하나|우리|NH농협|농협|NH|BC|비씨|씨티|IBK기업|IBK|기업|카카오뱅크|카카오페이|토스뱅크|토스|케이뱅크|SC제일|수협|광주|전북|경남|부산|대구|제주|신협|우체국|새마을|KDB|산업)"
                    + "\\s*(카드|체크카드|체크|BC카드|신용)?");
    private static final Pattern AMOUNT = Pattern.compile("(?<![\\d,])(\\d{1,3}(?:,\\d{3})+|\\d+)\\s*원");
    private static final Pattern DATE = Pattern.compile("(?<!\\d)(\\d{1,2})[/.-](\\d{1,2})(?![\\d/])");
    private static final Pattern TIME = Pattern.compile("(?<!\\d)([01]?\\d|2[0-3]):([0-5]\\d)(?!\\d)");
    private static final Pattern INSTALLMENT = Pattern.compile("일시불|(\\d{1,2})\\s*개월");
    private static final Pattern HEADER = Pattern.compile("\\[?\\s*(Web발신|국외발신|국제발신|광고)\\s*]?");
    private static final Pattern MASKED_NAME = Pattern.compile("[가-힣A-Za-z]{1,3}\\*[가-힣A-Za-z*]{0,3}\\s*(님|고객님)?");
    private static final Pattern CARD_NO = Pattern.compile("[(\\[]?\\s*\\d{3,4}\\s*[)\\]]?|[\\d*]*\\*[\\d*]*");
    /** 누적·잔액·한도 등 결제 금액이 아닌 숫자 */
    private static final Pattern NOT_PAYMENT = Pattern.compile("(누적|잔액|잔고|한도|포인트|적립|가용|결제예정|청구)\\s*:?\\s*-?[\\d,]+\\s*원?");

    public static Parsed parse(String raw) {
        return parse(raw, LocalDate.now(ZoneId.of("Asia/Seoul")));
    }

    public static Parsed parse(String raw, LocalDate today) {
        if (raw == null) return null;
        String text = raw.replace('\r', '\n').replace(' ', ' ').trim();
        if (text.isEmpty() || text.length() > 2000) return null;

        boolean approved = text.contains("승인") || text.contains("결제") || text.contains("사용");
        if (!approved) return null;
        if (text.contains("인증번호") || text.contains("입금") && !text.contains("승인")) return null;

        // 금액: 누적/잔액 등을 뺀 첫 번째 'NN,NNN원'
        String noTotals = NOT_PAYMENT.matcher(text).replaceAll(" ");
        Matcher am = AMOUNT.matcher(noTotals);
        if (!am.find()) return null;
        long amount = Long.parseLong(am.group(1).replace(",", ""));
        if (amount <= 0 || amount > 100_000_000L) return null;

        Matcher cm = CARD.matcher(text);
        String cardName = null;
        if (cm.find()) {
            String kind = cm.group(2) == null ? "카드" : cm.group(2).replace("체크카드", "체크");
            cardName = cm.group(1) + kind;
        } else if (!text.contains("카드") && !text.contains("체크")) {
            return null; // 카드 문자로 보이지 않음
        }

        Parsed p = new Parsed();
        p.setCancel(text.contains("취소"));
        p.setAmount(amount);
        p.setCardName(cardName);

        Matcher im = INSTALLMENT.matcher(text);
        if (im.find()) p.setInstallment(im.group(1) == null ? "일시불" : im.group(1) + "개월");

        // 날짜·시간 (연도는 오늘 기준, 미래 달이면 작년)
        LocalDate date = today;
        Matcher dm = DATE.matcher(noTotals.replaceAll(AMOUNT.pattern(), " "));
        if (dm.find()) {
            int m = Integer.parseInt(dm.group(1)), d = Integer.parseInt(dm.group(2));
            if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
                try {
                    date = LocalDate.of(today.getYear(), m, d);
                    // 결제는 미래일 수 없음 → 오늘보다 이틀 넘게 뒤면 작년 문자 (예: 1월에 받은 12/31 문자)
                    if (date.isAfter(today.plusDays(2))) date = date.minusYears(1);
                } catch (Exception ignored) { /* 2/30 같은 날짜 */ }
            }
        }
        p.setDate(date);
        Matcher tm = TIME.matcher(text);
        if (tm.find()) p.setTime(LocalTime.of(Integer.parseInt(tm.group(1)), Integer.parseInt(tm.group(2))));

        p.setMerchant(findMerchant(text));
        p.setCategory(guessCategory(p.getMerchant()));
        return p;
    }

    /** 알려진 조각을 지우고 남은 글자 중 가맹점 같은 것 */
    private static String findMerchant(String text) {
        String t = NOT_PAYMENT.matcher(text).replaceAll("\n");
        t = HEADER.matcher(t).replaceAll("\n");
        t = CARD.matcher(t).replaceAll("\n");
        t = AMOUNT.matcher(t).replaceAll("\n");
        t = TIME.matcher(t).replaceAll("\n");
        t = DATE.matcher(t).replaceAll("\n");
        t = INSTALLMENT.matcher(t).replaceAll("\n");
        t = MASKED_NAME.matcher(t).replaceAll("\n");
        t = t.replaceAll("승인\\s*취소|승인|취소|결제|사용|해외|일시불|할부|체크|신용|카드|님", "\n");
        t = CARD_NO.matcher(t).replaceAll("\n");
        t = t.replaceAll("[()\\[\\]|/:·,]", " ");
        String best = null;
        for (String part : t.split("\\n")) {
            String s = part.trim().replaceAll("\\s{2,}", " ");
            if (s.length() < 2 || s.matches("[\\d\\s.-]+")) continue;
            if (best == null || s.length() > best.length() && best.length() < 3) best = s;
            if (best != null && best.length() >= 2) break;
        }
        if (best != null && best.length() > 60) best = best.substring(0, 60);
        return best;
    }

    private static final Map<String, List<String>> CATEGORY_KEYWORDS = new LinkedHashMap<>();
    static {
        CATEGORY_KEYWORDS.put("카페", List.of("스타벅스", "투썸", "이디야", "메가", "컴포즈", "빽다방", "폴바셋", "할리스", "커피", "카페", "블루보틀", "공차", "베이커리", "파리바게뜨", "뚜레쥬르", "던킨", "배스킨"));
        CATEGORY_KEYWORDS.put("교통", List.of("카카오T", "카카오 T", "택시", "티머니", "버스", "지하철", "코레일", "KTX", "SRT", "주유", "SK에너지", "GS칼텍스", "S-OIL", "에스오일", "현대오일", "주차", "하이패스", "쏘카", "타다"));
        CATEGORY_KEYWORDS.put("쇼핑", List.of("쿠팡", "11번가", "G마켓", "지마켓", "옥션", "무신사", "29CM", "올리브영", "다이소", "네이버페이", "SSG", "신세계", "롯데백화점", "현대백화점", "유니클로", "자라", "이케아", "알리", "테무"));
        CATEGORY_KEYWORDS.put("식비", List.of("이마트", "홈플러스", "롯데마트", "코스트코", "마트", "GS25", "CU", "세븐일레븐", "이마트24", "편의점", "배달의민족", "배민", "요기요", "쿠팡이츠", "맥도날드", "버거킹", "롯데리아", "맘스터치", "KFC", "식당", "치킨", "피자", "김밥", "분식", "국밥", "고기", "푸드"));
        CATEGORY_KEYWORDS.put("문화", List.of("CGV", "메가박스", "롯데시네마", "넷플릭스", "유튜브", "멜론", "스포티파이", "교보문고", "예스24", "알라딘", "티켓", "인터파크", "게임"));
        CATEGORY_KEYWORDS.put("의료", List.of("병원", "의원", "약국", "치과", "한의원", "안과", "피부과"));
        CATEGORY_KEYWORDS.put("주거통신", List.of("SKT", "KT", "LGU", "LG유플러스", "통신", "관리비", "전기", "가스", "수도"));
    }

    public static String guessCategory(String merchant) {
        if (merchant == null) return "기타";
        String m = merchant.toUpperCase();
        for (Map.Entry<String, List<String>> e : CATEGORY_KEYWORDS.entrySet()) {
            for (String k : e.getValue()) if (m.contains(k.toUpperCase())) return e.getKey();
        }
        return "기타";
    }
}
