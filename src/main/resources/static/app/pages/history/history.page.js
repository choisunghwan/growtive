/**
 * 🧾 재무 대시보드 > 자산 내역
 * 가계부에 입력한 내역을 달력 없이 날짜별로 한데 모아 보여준다.
 * - 상단: ◀ 기간 ▶ + [검색] / 검색 조건 표시 / 기간 수입·지출 요약(기간만 기준, 고정) / 전체·지출·수입 보기 선택(목록에만 적용)
 * - 목록 맨 위: 카테고리·내용 검색 시 목록에 나온 내역의 건수와 합계 (전체 | 수입 | 지출)
 *   · 기간 단위: 전체(모든 내역) / 연별(◀ 2026년 ▶) / 월별(◀ 2026년 11월 ▶) / 주별(◀ 2026년 11월 1주차 ▶)
 *               / 사용자 입력(시작일~종료일 직접 지정, ◀▶ 없음)
 * - [검색] 모달: 기간(단위 선택 모달) / 카테고리(체크박스 모달) / 내용(메모 LIKE 검색)
 * - 본문: 날짜별 박스 하나(최근 날짜가 위) 안에 날짜 → 그날 내역 목록 → 그날 합계
 * - 수정: 가계부 캘린더의 해당 날짜로 이동해서 수정 폼을 바로 열어줌 / 삭제: 이 화면에서 바로 삭제
 * - 기간 선택 모달의 📌 핀: 고정한 기간이 자산 내역 메뉴 진입 시 기본 기간 (없으면 이번 달)
 *   · 서버(DB, /api/settings/history-pin)에 저장 → 기기가 달라도 같은 핀
 *   · 브라우저에는 화면을 바로 그리기 위한 캐시로만 보관하고, 진입할 때 서버 값으로 맞춤
 * 일정(schedule)은 보여주지 않는다. 데이터는 /api/money/ledger/search 를 사용.
 */

import { categoryIcon } from '../ledger/ledger.page.js';
import { initTopbarSalaryTicker } from '../../ui/salary-ticker.js';
import authStore from '../../store/authStore.js';
import { openModal, escapeHtml } from '../../ui/modal.js';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function won(n) { return `${Number(n || 0).toLocaleString('ko-KR')}원`; }
function pad2(n) { return String(n).padStart(2, '0'); }
function ymd(y, m, d) { return `${y}-${pad2(m)}-${pad2(d)}`; }
function daysInMonth(y, m) { return new Date(y, m, 0).getDate(); }


function sumOf(list) {
    let income = 0, expense = 0;
    for (const tx of list) {
        if (tx.type === 'INCOME') income += Number(tx.amount);
        else expense += Number(tx.amount);
    }
    return { income, expense };
}

/* ---------------- 주차 계산 (캘린더와 같은 일요일 시작, 그 달 안으로 한정) ---------------- */

function firstWeekday(y, m) { return new Date(y, m - 1, 1).getDay(); } // 0=일
function weeksInMonth(y, m) { return Math.ceil((firstWeekday(y, m) + daysInMonth(y, m)) / 7); }
function weekOfDay(y, m, day) { return Math.ceil((firstWeekday(y, m) + day) / 7); }
/** w주차의 시작일/종료일 (그 달 1일~말일 범위로 자름) */
function weekDayRange(y, m, w) {
    const start = 1 + (w - 1) * 7 - firstWeekday(y, m);
    return { startDay: Math.max(1, start), endDay: Math.min(daysInMonth(y, m), start + 6) };
}

/* ---------------- 보기 필터: 전체 / 지출 / 수입 (마지막 선택은 브라우저에 기억) ---------------- */

const FILTER_KEY = 'growtive-history-filter';
const FILTERS = [
    { key: 'ALL', label: '전체' },
    { key: 'INCOME', label: '수입' },
    { key: 'EXPENSE', label: '지출' },
];

function loadFilter() {
    try {
        const v = localStorage.getItem(FILTER_KEY);
        return FILTERS.some(f => f.key === v) ? v : 'ALL';
    } catch {
        return 'ALL';
    }
}

/* ---------------- 기간 단위 ---------------- */

const UNITS = [
    { key: 'ALL', label: '전체', desc: '등록한 모든 내역' },
    { key: 'YEAR', label: '연별', desc: '한 해 단위로 보기' },
    { key: 'MONTH', label: '월별', desc: '한 달 단위로 보기' },
    { key: 'WEEK', label: '주별', desc: '한 달 안의 주차 단위로 보기' },
    { key: 'CUSTOM', label: '사용자 입력', desc: '시작일과 종료일을 직접 지정' },
];
function unitLabel(key) { return (UNITS.find(u => u.key === key) || UNITS[2]).label; }

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
/** 'YYYY-MM-DD' → { y, m, d } */
function parseYmd(s) { const [y, m, d] = s.split('-').map(Number); return { y, m, d }; }
/** 'YYYY-MM-DD' → '2026.11.3' (같은 해면 연도 생략 가능) */
function dotDate(s, withYear = true) {
    const { y, m, d } = parseYmd(s);
    return withYear ? `${y}.${m}.${d}` : `${m}.${d}`;
}
/** 사용자 입력 기간 표시: '2026.11.3 ~ 11.20' (해가 다르면 둘 다 연도) */
function customRangeLabel(from, to) {
    const sameYear = from.slice(0, 4) === to.slice(0, 4);
    return `${dotDate(from)} ~ ${dotDate(to, !sameYear)}`;
}
/* ---------------- 📌 기본 기간 핀 (서버 저장 + 이 브라우저 캐시) ---------------- */

const PIN_KEY_PREFIX = 'growtive-history-pin:';
function pinKey() { return PIN_KEY_PREFIX + (authStore.getUserId?.() ?? 'guest'); }

/** 핀 값 검사: { unit } 또는 사용자 입력이면 { unit: 'CUSTOM', from, to }. 잘못됐으면 null */
function normalizePin(pin) {
    if (!pin || !UNITS.some(u => u.key === pin.unit)) return null;
    if (pin.unit !== 'CUSTOM') return { unit: pin.unit };
    if (!(DATE_RE.test(pin.from) && DATE_RE.test(pin.to) && pin.from <= pin.to)) return null;
    return { unit: 'CUSTOM', from: pin.from, to: pin.to };
}

function samePin(a, b) {
    return (a?.unit ?? null) === (b?.unit ?? null) && (a?.from ?? null) === (b?.from ?? null) && (a?.to ?? null) === (b?.to ?? null);
}

/** 브라우저 캐시에 있는 핀 (화면을 바로 그리는 용도) */
function loadPin() {
    try {
        return normalizePin(JSON.parse(localStorage.getItem(pinKey()) || 'null'));
    } catch {
        return null;
    }
}

function cachePin(pin) {
    try {
        if (pin) localStorage.setItem(pinKey(), JSON.stringify(pin));
        else localStorage.removeItem(pinKey());
    } catch { /* 캐시 못 해도 서버 값으로 동작 */ }
}

/** 서버에 저장된 핀 (없으면 null). 서버 응답으로 캐시도 갱신 */
async function fetchServerPin() {
    const res = await axios.get('/api/settings/history-pin');
    const pin = res.status === 204 ? null : normalizePin(res.data);
    cachePin(pin);
    return pin;
}

/** 핀 저장/해제를 서버에 반영 (성공하면 캐시도 갱신) */
async function persistPin(pin) {
    if (pin) await axios.put('/api/settings/history-pin', pin);
    else await axios.delete('/api/settings/history-pin');
    cachePin(pin);
}

const ICON_PIN = `<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path class="pin-shape" d="M9 3h6l-1 5 3 3v2h-4v6l-1 2-1-2v-6H7v-2l3-3z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`;

function daysBetween(from, to) {
    return Math.round((new Date(to + 'T00:00:00') - new Date(from + 'T00:00:00')) / 86400000) + 1;
}

function totalsChipsHtml({ income, expense }, filter) {
    // 지출만/수입만 볼 때는 그 금액 하나만 (합계가 같은 숫자라 중복)
    if (filter === 'EXPENSE') return `<span class="ledger-day-chip is-expense">지출 -${won(expense)}</span>`;
    if (filter === 'INCOME') return `<span class="ledger-day-chip is-income">수입 +${won(income)}</span>`;
    const net = income - expense;
    // 첫 줄: 합계 / 둘째 줄: 수입 · 지출
    const detail = `
        ${income ? `<span class="ledger-day-chip is-income">수입 +${won(income)}</span>` : ''}
        ${expense ? `<span class="ledger-day-chip is-expense">지출 -${won(expense)}</span>` : ''}`;
    return `
        <div class="history-chip-row">
            <span class="ledger-day-chip ledger-day-net ${net >= 0 ? 'is-income' : 'is-expense'}">합계 ${net >= 0 ? '+' : '-'}${won(Math.abs(net))}</span>
        </div>
        <div class="history-chip-row">${detail}</div>`;
}

export default function HistoryPage() {
    const now = new Date();
    const today = { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() };

    const state = {
        unit: 'MONTH',                 // 'ALL' | 'YEAR' | 'MONTH' | 'WEEK' | 'CUSTOM'
        customFrom: null,              // 사용자 입력 기간 (YYYY-MM-DD)
        customTo: null,
        year: today.y,
        month: today.m,
        week: weekOfDay(today.y, today.m, today.d),
        categories: [],                // 빈 배열 = 전체 카테고리
        keyword: '',                   // 빈 문자열 = 조건 없음
        transactions: [],              // 검색 결과 (기간 + 카테고리 + 내용) → 목록
        periodTransactions: [],        // 기간만 적용한 내역 → 상단 수입/지출/합계
        filter: loadFilter(),          // 'ALL' | 'EXPENSE' | 'INCOME'
        usedCategories: null,          // 검색 모달용 (처음 열 때 한 번 불러옴)
    };
    let requestSeq = 0;                // 빠르게 ◀▶를 눌렀을 때 늦게 온 예전 응답 무시용

    /**
     * 📌 핀 기준 기본 기간으로 맞춤 (전체/연별/주별은 오늘 기준, 사용자 입력은 저장한 날짜, 핀 없으면 이번 달)
     */
    function applyPin(pin) {
        state.unit = pin?.unit || 'MONTH';
        state.year = today.y;
        state.month = today.m;
        state.week = weekOfDay(today.y, today.m, today.d);
        if (pin?.unit === 'CUSTOM') {
            state.customFrom = pin.from;
            state.customTo = pin.to;
        }
    }

    // 우선 브라우저 캐시의 핀으로 바로 그리고, 화면이 뜨면 서버 값으로 다시 맞춤 (onMounted)
    let currentPin = loadPin();        // 지금 고정된 핀 (서버 값을 받으면 그걸로 바뀜)
    applyPin(currentPin);
    // 핀은 '메뉴 진입 시 시작 기간'일 뿐. 사용자가 기간을 바꾼 뒤에는 핀이 조회 기간을 덮어쓰지 않도록 표시
    let periodTouched = false;

    /* ---------------- 기간 ---------------- */

    /** 현재 단위/기준으로 검색할 from~to (전체면 null) */
    function periodRange() {
        const { unit, year: y, month: m, week: w } = state;
        if (unit === 'YEAR') return { from: `${y}-01-01`, to: `${y}-12-31` };
        if (unit === 'MONTH') return { from: ymd(y, m, 1), to: ymd(y, m, daysInMonth(y, m)) };
        if (unit === 'WEEK') {
            const { startDay, endDay } = weekDayRange(y, m, w);
            return { from: ymd(y, m, startDay), to: ymd(y, m, endDay) };
        }
        if (unit === 'CUSTOM') return { from: state.customFrom, to: state.customTo };
        return { from: null, to: null };
    }

    function periodLabel() {
        const { unit, year: y, month: m, week: w } = state;
        if (unit === 'YEAR') return `${y}년`;
        if (unit === 'MONTH') return `${y}년 ${m}월`;
        if (unit === 'WEEK') return `${y}년 ${m}월 ${w}주차`;
        if (unit === 'CUSTOM') return customRangeLabel(state.customFrom, state.customTo);
        return '전체 기간';
    }

    function periodSubLabel() {
        if (state.unit === 'CUSTOM') return `사용자 입력 · ${daysBetween(state.customFrom, state.customTo)}일`;
        if (state.unit !== 'WEEK') return '';
        const { startDay, endDay } = weekDayRange(state.year, state.month, state.week);
        return `${state.month}/${startDay} ~ ${state.month}/${endDay}`;
    }

    /** 기간 단위를 바꿀 때 기준 시점 맞추기 */
    function setUnit(unit) {
        if (unit === state.unit) return;
        if (state.unit === 'CUSTOM' && unit !== 'ALL') {
            // 사용자 입력 기간에서 다른 단위로 바꾸면 그 기간의 시작일을 기준으로
            const { y, m } = parseYmd(state.customFrom);
            state.year = y;
            state.month = m;
        }
        if (unit === 'WEEK') {
            // 이번 달이면 오늘이 속한 주, 다른 달이면 1주차
            state.week = (state.year === today.y && state.month === today.m)
                ? weekOfDay(today.y, today.m, today.d) : 1;
        }
        state.unit = unit;
    }

    function movePeriod(dir) {
        periodTouched = true;
        if (state.unit === 'YEAR') {
            state.year += dir;
        } else if (state.unit === 'MONTH') {
            state.month += dir;
            if (state.month < 1) { state.month = 12; state.year--; }
            if (state.month > 12) { state.month = 1; state.year++; }
        } else if (state.unit === 'WEEK') {
            state.week += dir;
            if (state.week < 1) {
                state.month--;
                if (state.month < 1) { state.month = 12; state.year--; }
                state.week = weeksInMonth(state.year, state.month);
            } else if (state.week > weeksInMonth(state.year, state.month)) {
                state.month++;
                if (state.month > 12) { state.month = 1; state.year++; }
                state.week = 1;
            }
        }
    }

    /* ---------------- 데이터 ---------------- */

    async function load() {
        const { from, to } = periodRange();
        const periodParams = new URLSearchParams();
        if (from) periodParams.append('from', from);
        if (to) periodParams.append('to', to);

        const seq = ++requestSeq;
        const fetch = async (params) => (await axios.get('/api/money/ledger/search', { params })).data || [];

        let periodTxs, resultTxs;
        if (hasSearchCondition()) {
            // 카테고리는 categories=a&categories=b 형태로 보내야 스프링 List<String>으로 받음
            const searchParams = new URLSearchParams(periodParams);
            state.categories.forEach(c => searchParams.append('categories', c));
            if (state.keyword) searchParams.append('keyword', state.keyword);
            [periodTxs, resultTxs] = await Promise.all([fetch(periodParams), fetch(searchParams)]);
        } else {
            // 검색 조건이 없으면 기간 내역 = 목록이므로 한 번만 부름
            periodTxs = resultTxs = await fetch(periodParams);
        }

        if (seq !== requestSeq) return false; // 더 최근 요청이 있음
        state.periodTransactions = periodTxs;
        state.transactions = resultTxs;
        return true;
    }

    async function loadUsedCategories() {
        if (state.usedCategories) return state.usedCategories;
        const { data } = await axios.get('/api/money/ledger/categories');
        state.usedCategories = data || [];
        return state.usedCategories;
    }

    /* ---------------- 화면 조각 ---------------- */

    function filterHtml() {
        return FILTERS.map(f => `
            <label class="history-filter-opt">
                <input type="radio" name="historyFilter" value="${f.key}"${state.filter === f.key ? ' checked' : ''}>
                <span>${f.label}</span>
            </label>`).join('');
    }

    function hasSearchCondition() {
        return state.categories.length > 0 || !!state.keyword;
    }

    function conditionHtml() {
        if (!hasSearchCondition()) return '';
        const parts = [];
        if (state.categories.length) parts.push(`카테고리 <b>${state.categories.map(escapeHtml).join(', ')}</b>`);
        if (state.keyword) parts.push(`내용 <b>'${escapeHtml(state.keyword)}'</b>`);
        return `
            <span class="history-condition-text">🔎 ${parts.join(' · ')}</span>
            <button type="button" class="btn btn-xs" id="clearSearchBtn">조건 초기화</button>`;
    }

    /** 상단 요약: 기간만 기준 (카테고리·내용 검색, 라디오 선택과 무관) */
    function summaryHtml() {
        return sumColumnsHtml(sumOf(state.periodTransactions));
    }

    /** 전체 | 수입 | 지출 3칸 표 (상단 요약, 하단 검색 결과 합계 공용) */
    function sumColumnsHtml({ income, expense }) {
        const net = income - expense;
        // 좁은 화면에서 아주 큰 금액은 쉼표 뒤에서만 줄바꿈되도록 <wbr> 삽입
        const num = (n) => Number(n || 0).toLocaleString('ko-KR').replace(/,/g, ',<wbr>');
        // 3칸 표 (전체 | 수입 | 지출): 위에 항목명, 아래에 금액 (전체 = 수입-지출, 지출은 -)
        return `
            <div class="history-sum-col">
                <span class="history-sum-label">전체</span>
                <b class="history-sum-value ${net >= 0 ? 'is-income' : 'is-expense'}">${net < 0 ? '-' : ''}${num(Math.abs(net))}</b>
            </div>
            <div class="history-sum-col">
                <span class="history-sum-label">수입</span>
                <b class="history-sum-value is-income">${num(income)}</b>
            </div>
            <div class="history-sum-col">
                <span class="history-sum-label">지출</span>
                <b class="history-sum-value is-expense">${expense ? '-' : ''}${num(expense)}</b>
            </div>`;
    }

    function txItemHtml(tx) {
        const isRecurringRelated = tx.recurring || tx.recurringOriginId;
        return `
            <li class="ledger-tx-item">
                <div class="ledger-tx-main">
                    <span class="ledger-tx-category">${categoryIcon(tx.category)} ${escapeHtml(tx.category)}${isRecurringRelated ? ' <span class="ledger-tx-recurring-badge" title="매달 반복">🔁</span>' : ''}${tx.hidden ? ' <span class="ledger-tx-recurring-badge" title="친구에게 숨김">🙈</span>' : ''}</span>
                    <span class="ledger-tx-amount ${tx.type === 'INCOME' ? 'is-income' : 'is-expense'}">
                        ${tx.type === 'INCOME' ? '+' : '-'}${won(tx.amount)}
                    </span>
                </div>
                <div class="ledger-tx-sub">
                    <span class="ledger-tx-memo">${tx.memo ? escapeHtml(tx.memo) : ''}</span>
                    <span class="ledger-tx-actions">
                        <a class="btn btn-xs" href="#/calendar?date=${tx.date}&edit=${tx.id}">수정</a>
                        <button type="button" class="btn btn-xs btn-danger" data-del="${tx.id}">삭제</button>
                    </span>
                </div>
            </li>`;
    }

    function listHtml() {
        const txs = state.filter === 'ALL'
            ? state.transactions
            : state.transactions.filter(tx => tx.type === state.filter);

        if (txs.length === 0) {
            const what = state.filter === 'EXPENSE' ? '지출 내역' : state.filter === 'INCOME' ? '수입 내역' : '내역';
            if (hasSearchCondition()) return `<div class="hint">검색 조건에 맞는 ${what}이 없습니다.</div>`;
            const where = state.unit === 'ALL' ? '' : `${periodLabel()}에 `;
            return `<div class="hint">${where}등록된 ${what}이 없습니다.</div>`;
        }

        const byDate = {};
        for (const tx of txs) (byDate[tx.date] ||= []).push(tx);
        const dates = Object.keys(byDate).sort().reverse(); // 최근 날짜가 위로
        // 전체 기간은 여러 해가 섞이므로 날짜에 연도까지 표시
        const showYear = state.unit === 'ALL'
            || (state.unit === 'CUSTOM' && state.customFrom.slice(0, 4) !== state.customTo.slice(0, 4));

        const daysHtml = dates.map(dateStr => {
            const list = byDate[dateStr];
            const d = new Date(dateStr + 'T00:00:00');
            const dow = d.getDay();
            const dowClass = dow === 0 ? ' is-sunday' : dow === 6 ? ' is-saturday' : '';
            return `
                <section class="history-day">
                    <h3 class="history-day-title${dowClass}">${showYear ? `${d.getFullYear()}년 ` : ''}${d.getMonth() + 1}월 ${d.getDate()}일 <span>(${WEEKDAYS[dow]})</span></h3>
                    <ul class="ledger-tx-list history-tx-list">${list.map(txItemHtml).join('')}</ul>
                    <div class="ledger-day-totals history-day-totals">${totalsChipsHtml(sumOf(list), state.filter)}</div>
                </section>`;
        }).join('');

        // 검색 결과 합계는 목록 맨 위에
        return resultTotalHtml(txs) + daysHtml;
    }

    /**
     * 목록 맨 위: 카테고리·내용으로 검색했을 때 목록에 나온 내역의 건수와 합계
     * - 상단과 같은 전체 | 수입 | 지출 3칸 표
     * - 라디오 선택 반영 (예: '지출'이면 목록에 보이는 지출만 더함)
     */
    function resultTotalHtml(txs) {
        if (!hasSearchCondition()) return '';
        return `
            <div class="history-result-total">
                <div class="history-result-count">검색 결과 <b>${txs.length}건</b></div>
                <div class="history-result-sum">${sumColumnsHtml(sumOf(txs))}</div>
            </div>`;
    }

    return {
        title: '자산 내역',

        render() {
            return `
            <section class="ledger-page history-page">
                <div class="card">
                    <div class="ledger-header history-header">
                        <div class="ledger-month-nav">
                            <button id="prevPeriod" class="ledger-nav-btn" type="button" aria-label="이전 기간">◀</button>
                            <div class="history-period">
                                <h2 id="periodLabel">${periodLabel()}</h2>
                                <div class="history-period-sub" id="periodSub"></div>
                            </div>
                            <button id="nextPeriod" class="ledger-nav-btn" type="button" aria-label="다음 기간">▶</button>
                        </div>
                        <button type="button" class="btn btn-sm btn-pill history-search-btn" id="openSearchBtn">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                            검색
                        </button>
                    </div>
                    <div class="history-condition" id="historyCondition"></div>
                    <div class="ledger-summary" id="monthSummary"></div>
                    <!-- 전체/지출/수입 보기: 요약 금액 아래, 목록 바로 위 (목록에만 적용) -->
                    <div class="history-filter" id="historyFilter" role="radiogroup" aria-label="내역 보기">${filterHtml()}</div>
                </div>

                <div class="card">
                    <div id="historyList"><div class="hint">불러오는 중…</div></div>
                </div>
            </section>`;
        },

        async onMounted() {
            const $ = (id) => document.getElementById(id);

            function renderList() {
                $('historyList').innerHTML = listHtml();
            }

            function renderHeader() {
                $('periodLabel').textContent = periodLabel();
                const sub = periodSubLabel();
                $('periodSub').textContent = sub;
                $('periodSub').style.display = sub ? '' : 'none';
                // 전체 기간에는 앞뒤로 넘길 게 없으므로 화살표 숨김
                // 전체/사용자 입력 기간에는 앞뒤로 넘길 단위가 없으므로 화살표 숨김
                const showNav = state.unit !== 'ALL' && state.unit !== 'CUSTOM';
                // (자리도 차지하지 않게 숨겨서 검색 버튼이 같은 줄에 남도록)
                $('prevPeriod').style.display = showNav ? '' : 'none';
                $('nextPeriod').style.display = showNav ? '' : 'none';

                const cond = conditionHtml();
                $('historyCondition').innerHTML = cond;
                $('historyCondition').style.display = cond ? '' : 'none';
                $('clearSearchBtn')?.addEventListener('click', () => {
                    state.categories = [];
                    state.keyword = '';
                    refresh();
                });
            }

            async function refresh() {
                renderHeader();
                try {
                    if (!(await load())) return;
                } catch (err) {
                    console.error(err);
                    $('historyList').innerHTML = `<div class="hint">내역을 불러오지 못했어요. 잠시 후 다시 시도해주세요.</div>`;
                    return;
                }
                $('monthSummary').innerHTML = summaryHtml();
                renderList();
            }

            /* ---------------- 검색 모달 ---------------- */

            function openSearchModal() {
                // 모달 안에서 고른 값은 [검색]을 눌러야 실제로 적용
                const draft = {
                    unit: state.unit,
                    customFrom: state.customFrom,
                    customTo: state.customTo,
                    categories: [...state.categories],
                    keyword: state.keyword,
                };
                const unitSummary = () => draft.unit === 'CUSTOM'
                    ? customRangeLabel(draft.customFrom, draft.customTo)
                    : unitLabel(draft.unit);

                const categorySummary = () => {
                    if (draft.categories.length === 0) return '전체';
                    if (draft.categories.length <= 2) return draft.categories.join(', ');
                    return `${draft.categories.slice(0, 2).join(', ')} 외 ${draft.categories.length - 2}개`;
                };

                const modal = openModal({
                    title: '내역 검색',
                    bodyHtml: `
                        <div class="history-search-row">
                            <span class="history-search-label">기간</span>
                            <button type="button" class="history-picker-btn" id="pickUnitBtn">
                                <span id="pickUnitText">${escapeHtml(unitSummary())}</span><span aria-hidden="true">›</span>
                            </button>
                        </div>
                        <div class="history-search-row">
                            <span class="history-search-label">카테고리</span>
                            <button type="button" class="history-picker-btn" id="pickCategoryBtn">
                                <span id="pickCategoryText">${escapeHtml(categorySummary())}</span><span aria-hidden="true">›</span>
                            </button>
                        </div>
                        <div class="history-search-row">
                            <label class="history-search-label" for="searchKeyword">내용</label>
                            <input type="text" id="searchKeyword" class="history-search-input" maxlength="100"
                                   placeholder="메모에서 찾을 내용 (비워두면 전체)" value="${escapeHtml(draft.keyword)}">
                        </div>`,
                    actionsHtml: `
                        <button type="button" class="btn btn-ghost" data-modal-close>닫기</button>
                        <button type="button" class="btn btn-primary" id="doSearchBtn">검색</button>`,
                });
                const root = modal.el;
                const keywordInput = root.querySelector('#searchKeyword');

                root.querySelector('#pickUnitBtn').addEventListener('click', () => {
                    // 사용자 입력 칸의 기본값: 지금 보고 있는 기간 (전체면 이번 달 1일 ~ 오늘)
                    const cur = periodRange();
                    const defaults = {
                        from: draft.customFrom || cur.from || ymd(today.y, today.m, 1),
                        to: draft.customTo || cur.to || ymd(today.y, today.m, today.d),
                    };
                    openUnitModal(draft.unit, defaults, (unit, range) => {
                        draft.unit = unit;
                        if (unit === 'CUSTOM') {
                            draft.customFrom = range.from;
                            draft.customTo = range.to;
                        }
                        root.querySelector('#pickUnitText').textContent = unitSummary();
                    });
                });

                root.querySelector('#pickCategoryBtn').addEventListener('click', () => {
                    openCategoryModal(draft.categories, (selected) => {
                        draft.categories = selected;
                        root.querySelector('#pickCategoryText').textContent = categorySummary();
                    });
                });

                const doSearch = () => {
                    periodTouched = true;
                    if (draft.unit === 'CUSTOM') {
                        state.customFrom = draft.customFrom;
                        state.customTo = draft.customTo;
                    }
                    setUnit(draft.unit);
                    state.categories = draft.categories;
                    state.keyword = keywordInput.value.trim();
                    modal.close();
                    refresh();
                };
                root.querySelector('#doSearchBtn').addEventListener('click', doSearch);
                keywordInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); doSearch(); }
                });
            }

            /**
             * 기간 단위 선택 모달
             * - 전체/연별/월별/주별: 고르면 바로 닫히고 onPick(unit)
             * - 사용자 입력: 아래에 시작일·종료일 칸이 열리고 [적용]을 눌러야 onPick('CUSTOM', {from, to})
             */
            function openUnitModal(current, defaults, onPick) {
                const modal = openModal({
                    title: '기간 선택',
                    className: 'history-modal--sub',
                    bodyHtml: `
                        <div class="history-option-list">
                            ${UNITS.map(u => `
                                <div class="history-option-row">
                                    <button type="button" class="history-option${u.key === current ? ' is-selected' : ''}" data-unit="${u.key}"
                                            ${u.key === 'CUSTOM' ? `aria-expanded="${current === 'CUSTOM'}" aria-controls="customRangeForm"` : ''}>
                                        <span class="history-option-label">${u.label}</span>
                                        <span class="history-option-desc" data-desc="${u.key}">${u.desc}</span>
                                    </button>
                                    <button type="button" class="history-pin-btn" data-pin="${u.key}" aria-pressed="false"
                                            title="자산 내역 메뉴를 열 때 이 기간으로 보기">${ICON_PIN}</button>
                                </div>`).join('')}
                        </div>
                        <p class="history-pin-help">📌 핀을 꽂은 기간이 자산 내역 메뉴를 열 때 기본으로 보여요. (없으면 이번 달)</p>
                        <div class="history-custom-range" id="customRangeForm"${current === 'CUSTOM' ? '' : ' hidden'}>
                            <div class="history-custom-fields">
                                <label class="history-custom-field">
                                    <span>시작일</span>
                                    <input type="date" id="customFrom" value="${defaults.from}">
                                </label>
                                <span class="history-custom-tilde" aria-hidden="true">~</span>
                                <label class="history-custom-field">
                                    <span>종료일</span>
                                    <input type="date" id="customTo" value="${defaults.to}">
                                </label>
                            </div>
                            <p class="history-custom-error" id="customError" role="alert" hidden></p>
                            <button type="button" class="btn btn-primary history-custom-apply" id="customApplyBtn">적용</button>
                        </div>`,
                });
                const root = modal.el;
                const form = root.querySelector('#customRangeForm');
                const customBtn = root.querySelector('[data-unit="CUSTOM"]');

                /* 📌 핀: 한 번에 하나만. 같은 핀을 다시 누르면 해제. 누르면 바로 표시하고 서버에 저장 */
                function renderPins(pin = currentPin) {
                    root.querySelectorAll('[data-pin]').forEach(btn => {
                        const on = pin?.unit === btn.dataset.pin;
                        btn.classList.toggle('is-pinned', on);
                        btn.setAttribute('aria-pressed', String(on));
                        const label = UNITS.find(u => u.key === btn.dataset.pin).label;
                        btn.setAttribute('aria-label', on ? `${label} 기본 기간 고정 해제` : `${label}을(를) 기본 기간으로 고정`);
                    });
                    // 사용자 입력에 핀이 있으면 설명 자리에 고정된 날짜 표시
                    const desc = root.querySelector('[data-desc="CUSTOM"]');
                    desc.textContent = pin?.unit === 'CUSTOM'
                        ? `고정: ${customRangeLabel(pin.from, pin.to)}`
                        : UNITS.find(u => u.key === 'CUSTOM').desc;
                }
                renderPins();

                let savingPin = false;
                async function changePin(next) {
                    if (savingPin) return;
                    savingPin = true;
                    const prev = currentPin;
                    currentPin = next;
                    renderPins();                       // 먼저 화면에 반영
                    root.querySelectorAll('[data-pin]').forEach(b => { b.disabled = true; });
                    try {
                        await persistPin(next);         // 서버(DB)에 저장
                    } catch (err) {
                        console.error(err);
                        currentPin = prev;              // 실패하면 원래대로
                        renderPins();
                        alert('핀을 저장하지 못했어요. 잠시 후 다시 시도해주세요.');
                    } finally {
                        savingPin = false;
                        root.querySelectorAll('[data-pin]').forEach(b => { b.disabled = false; });
                    }
                }

                root.querySelectorAll('[data-pin]').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const unit = btn.dataset.pin;
                        if (unit !== 'CUSTOM') {
                            changePin(currentPin?.unit === unit ? null : { unit });
                            return;
                        }
                        // 사용자 입력: 아래 날짜 칸의 기간을 고정 (같은 기간으로 이미 고정돼 있으면 해제)
                        form.hidden = false;
                        customBtn.setAttribute('aria-expanded', 'true');
                        const range = readCustomRange();
                        if (!range) return;
                        const next = { unit: 'CUSTOM', ...range };
                        changePin(samePin(currentPin, next) ? null : next);
                    });
                });

                /** 날짜 칸 값을 검사해서 {from, to} (잘못되면 오류 문구 띄우고 null) */
                function readCustomRange() {
                    const from = root.querySelector('#customFrom').value;
                    const to = root.querySelector('#customTo').value;
                    const errorEl = root.querySelector('#customError');
                    let error = '';
                    if (!DATE_RE.test(from) || !DATE_RE.test(to)) error = '시작일과 종료일을 모두 입력해주세요.';
                    else if (from > to) error = '시작일이 종료일보다 늦어요.';
                    errorEl.textContent = error;
                    errorEl.hidden = !error;
                    return error ? null : { from, to };
                }

                root.querySelectorAll('[data-unit]').forEach(btn => {
                    btn.addEventListener('click', () => {
                        if (btn.dataset.unit === 'CUSTOM') {
                            // 바로 닫지 않고 날짜 입력 칸을 펼침
                            form.hidden = false;
                            customBtn.setAttribute('aria-expanded', 'true');
                            root.querySelectorAll('[data-unit]').forEach(b => b.classList.toggle('is-selected', b === btn));
                            root.querySelector('#customFrom').focus();
                            return;
                        }
                        onPick(btn.dataset.unit);
                        modal.close();
                    });
                });

                // 날짜를 고치면 오류 문구는 지움
                root.querySelectorAll('#customFrom, #customTo').forEach(input => {
                    input.addEventListener('input', () => { root.querySelector('#customError').hidden = true; });
                });

                root.querySelector('#customApplyBtn').addEventListener('click', () => {
                    const range = readCustomRange();
                    if (!range) return;
                    onPick('CUSTOM', range);
                    modal.close();
                });
            }

            /** 카테고리 체크박스 모달: [선택 완료]를 눌러야 반영 */
            async function openCategoryModal(current, onDone) {
                const modal = openModal({
                    title: '카테고리 선택',
                    className: 'history-modal--sub',
                    bodyHtml: `<div class="hint">불러오는 중…</div>`,
                    actionsHtml: `
                        <button type="button" class="btn btn-ghost" id="catClearBtn">전체 해제</button>
                        <button type="button" class="btn btn-primary" id="catDoneBtn">선택 완료</button>`,
                });
                const root = modal.el;
                const body = root.querySelector('.history-modal-body');

                let categories;
                try {
                    categories = await loadUsedCategories();
                } catch (err) {
                    console.error(err);
                    body.innerHTML = `<div class="hint">카테고리를 불러오지 못했어요.</div>`;
                    return;
                }
                if (!root.isConnected) return; // 불러오는 사이에 닫음

                // 예전에 골랐지만 지금은 없는 카테고리도 목록에 남겨서 해제할 수 있게
                const all = [...new Set([...categories, ...current])];
                body.innerHTML = all.length === 0
                    ? `<div class="hint">아직 등록된 내역이 없어 선택할 카테고리가 없습니다.</div>`
                    : `<p class="history-modal-help">선택하지 않으면 전체 카테고리에서 찾아요.</p>
                       <ul class="history-category-list">
                           ${all.map(c => `
                               <li>
                                   <label class="history-category-item">
                                       <span>${categoryIcon(c)} ${escapeHtml(c)}</span>
                                       <input type="checkbox" value="${escapeHtml(c)}"${current.includes(c) ? ' checked' : ''}>
                                   </label>
                               </li>`).join('')}
                       </ul>`;

                root.querySelector('#catClearBtn').addEventListener('click', () => {
                    body.querySelectorAll('input[type=checkbox]').forEach(cb => { cb.checked = false; });
                });
                root.querySelector('#catDoneBtn').addEventListener('click', () => {
                    const selected = [...body.querySelectorAll('input[type=checkbox]:checked')].map(cb => cb.value);
                    onDone(selected);
                    modal.close();
                });
            }

            /* ---------------- 이벤트 ---------------- */

            $('openSearchBtn').addEventListener('click', openSearchModal);

            // 전체/지출/수입 전환: 이미 불러온 데이터에서 걸러서 다시 그림 (서버 재호출 없음)
            $('historyFilter').addEventListener('change', (e) => {
                if (e.target.name !== 'historyFilter') return;
                state.filter = e.target.value;
                try { localStorage.setItem(FILTER_KEY, state.filter); } catch { /* 기억 못 해도 동작엔 지장 없음 */ }
                renderList();
            });

            $('prevPeriod').addEventListener('click', () => { movePeriod(-1); refresh(); });
            $('nextPeriod').addEventListener('click', () => { movePeriod(1); refresh(); });

            $('historyList').addEventListener('click', async (e) => {
                const btn = e.target.closest('button[data-del]');
                if (!btn) return;
                const tx = state.transactions.find(t => t.id === Number(btn.dataset.del));
                if (!tx) return;
                if (!confirm(`${tx.date} ${tx.category} ${won(tx.amount)} 내역을 삭제할까요?`)) return;
                btn.disabled = true;
                try {
                    await axios.delete(`/api/money/ledger/${tx.id}`);
                } catch (err) {
                    console.error(err);
                    alert('삭제하지 못했어요. 잠시 후 다시 시도해주세요.');
                    btn.disabled = false;
                    return;
                }
                state.usedCategories = null; // 마지막 내역이 지워진 카테고리가 있을 수 있음
                await refresh();
                initTopbarSalaryTicker();
            });

            // 📌 서버에 저장된 핀 확인 → 캐시와 다르면(다른 기기에서 바꿈 등) 서버 값 기준으로 기본 기간을 다시 맞춤
            try {
                const serverPin = await fetchServerPin();
                if (!samePin(serverPin, currentPin)) {
                    currentPin = serverPin;
                    // 서버 응답 전에 사용자가 이미 기간을 바꿨으면 그 선택을 유지
                    if (!periodTouched) applyPin(serverPin);
                }
            } catch (err) {
                console.warn('핀 설정을 불러오지 못해 브라우저에 저장된 값으로 표시합니다.', err);
            }

            await refresh();
        }
    };
}
