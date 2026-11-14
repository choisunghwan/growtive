// resources/static/app/core/payday.js
// 💰 월급날 계산 (마이페이지 › 근무 시간 설정의 '월급날' 규칙)
//  - DAY         : 매달 N일 (그달에 없는 날이면 말일)
//  - LAST_DAY    : 매달 말일
//  - NTH_WEEKDAY : 매달 N번째 X요일 (payWeek -1 = 마지막 주)
//  - payAdjust   : 그날이 주말·공휴일이면 BEFORE(전 평일) / AFTER(다음 평일) / KEEP(그대로)

import { HOLIDAYS } from './holidays.js';

const pad2 = (n) => String(n).padStart(2, '0');
export const ymdOf = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'];
const WEEK_KO = { 1: '첫째', 2: '둘째', 3: '셋째', 4: '넷째', '-1': '마지막' };

export function hasPayRule(s) {
    return !!(s && ['DAY', 'LAST_DAY', 'NTH_WEEKDAY'].includes(s.payRule));
}

function isOffDay(d) {
    const dow = d.getDay();
    return dow === 0 || dow === 6 || !!HOLIDAYS[ymdOf(d)];
}

/** 그 달의 월급날 (month: 1~12) */
export function paydayOf(year, month, s) {
    const lastDate = new Date(year, month, 0).getDate();
    let d;
    if (s.payRule === 'DAY') {
        d = new Date(year, month - 1, Math.min(Number(s.payDay) || 1, lastDate));
    } else if (s.payRule === 'LAST_DAY') {
        d = new Date(year, month - 1, lastDate);
    } else {
        const wd = Number(s.payWeekday);
        if (Number(s.payWeek) === -1) {
            const last = new Date(year, month - 1, lastDate);
            d = new Date(year, month - 1, lastDate - ((last.getDay() - wd + 7) % 7));
        } else {
            const first = new Date(year, month - 1, 1);
            d = new Date(year, month - 1, 1 + ((wd - first.getDay() + 7) % 7) + 7 * ((Number(s.payWeek) || 1) - 1));
        }
    }
    const step = s.payAdjust === 'AFTER' ? 1 : s.payAdjust === 'KEEP' ? 0 : -1; // 기본: 전 평일
    for (let i = 0; step && i < 10 && isOffDay(d); i++) d.setDate(d.getDate() + step);
    return d;
}

/** 지금이 속한 월급 기간: { start: 지난 월급날 0시, end: 다음 월급날 0시 } */
export function payPeriod(now, s) {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const y = today.getFullYear(), m = today.getMonth() + 1;
    const prevYm = m === 1 ? [y - 1, 12] : [y, m - 1];
    const nextYm = m === 12 ? [y + 1, 1] : [y, m + 1];
    const cur = paydayOf(y, m, s);
    if (today >= cur) return { start: cur, end: paydayOf(nextYm[0], nextYm[1], s) };
    return { start: paydayOf(prevYm[0], prevYm[1], s), end: cur };
}

/** 사람이 읽는 규칙 설명: '매달 25일 (주말·공휴일이면 전 평일)' */
export function describePayRule(s) {
    if (!hasPayRule(s)) return '설정 안 함 (매달 1일~말일 기준)';
    const base = s.payRule === 'DAY' ? `매달 ${s.payDay}일`
        : s.payRule === 'LAST_DAY' ? '매달 말일'
        : `매달 ${WEEK_KO[String(s.payWeek)] || ''} 주 ${WEEKDAY_KO[Number(s.payWeekday)] || ''}요일`;
    const adj = s.payAdjust === 'AFTER' ? '다음 평일' : s.payAdjust === 'KEEP' ? '그대로' : '전 평일';
    return `${base} (주말·공휴일이면 ${adj})`;
}

export function formatPayday(d) {
    return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAY_KO[d.getDay()]})`;
}
