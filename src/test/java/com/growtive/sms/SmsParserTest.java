package com.growtive.sms;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

class SmsParserTest {

    static final LocalDate TODAY = LocalDate.of(2026, 11, 14);
    static final LocalDate JAN = LocalDate.of(2027, 1, 2);

    static SmsParser.Parsed p(String s) { return SmsParser.parse(s, TODAY); }

    @Test void shinhan() {
        var r = p("[Web발신]\n신한카드(1234)승인\n홍*동\n12,000원(일시불)\n11/14 12:30\n스타벅스 강남점\n누적1,234,567원");
        assertEquals(12000, r.getAmount()); assertEquals("스타벅스 강남점", r.getMerchant());
        assertEquals("신한카드", r.getCardName()); assertEquals(LocalDate.of(2026, 11, 14), r.getDate());
        assertEquals("카페", r.getCategory()); assertFalse(r.isCancel()); assertEquals("일시불", r.getInstallment());
    }
    @Test void kb() {
        var r = p("[Web발신]\nKB국민카드1*2*승인\n홍*동님\n45,500원 일시불\n11/13 19:02\n이마트 성수점\n누적512,300원");
        assertEquals(45500, r.getAmount()); assertEquals("이마트 성수점", r.getMerchant()); assertEquals("식비", r.getCategory());
        assertEquals(LocalDate.of(2026, 11, 13), r.getDate());
    }
    @Test void samsungOneLine() {
        var r = p("삼성1234승인 홍*동 8,900원 일시불 11/12 08:15 GS25 역삼점 누적1,111,000원");
        assertEquals(8900, r.getAmount()); assertEquals("GS25 역삼점", r.getMerchant());
    }
    @Test void hyundaiInstallment() {
        var r = p("[현대카드]-승인 홍*동 360,000원 3개월 11/10 14:22 쿠팡");
        assertEquals(360000, r.getAmount()); assertEquals("3개월", r.getInstallment()); assertEquals("쿠팡", r.getMerchant()); assertEquals("쇼핑", r.getCategory());
    }
    @Test void cancel() {
        var r = p("[Web발신]\n신한카드(1234)승인취소\n홍*동\n12,000원\n11/14 13:01\n스타벅스 강남점");
        assertTrue(r.isCancel()); assertEquals(12000, r.getAmount()); assertEquals("스타벅스 강남점", r.getMerchant());
    }
    @Test void kakaobankCheck() {
        var r = p("[카카오뱅크] 홍*동 체크카드(1234) 6,500원 승인 메가MGC커피 11/14 09:41");
        assertEquals(6500, r.getAmount()); assertEquals("메가MGC커피", r.getMerchant()); assertEquals("카페", r.getCategory());
    }
    @Test void lastYear() {
        var r = SmsParser.parse("롯데카드 승인 홍*동 3,000원 12/31 23:10 CU 강남점", JAN);
        assertEquals(LocalDate.of(2026, 12, 31), r.getDate()); assertEquals("CU 강남점", r.getMerchant());
    }
    @Test void notCard() {
        assertNull(p("[Web발신] 인증번호 [123456]를 입력해주세요."));
        assertNull(p("오늘 저녁 7시에 만나요"));
        assertNull(p("[KB국민은행] 홍*동님 입금 50,000원 잔액 120,000원"));
    }
}
