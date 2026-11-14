/**
 * 📅 가계부 (캘린더) 페이지 - 홈
 * 날짜를 클릭해서 그날 쓴/번 돈을 바로 기록한다.
 * 같은 화면에서 "일정 캘린더" 모드로 전환하면 돈이 아닌 일반 일정(이벤트)을 등록할 수 있다.
 */

import { HOLIDAYS } from '../../core/holidays.js';
import { initTopbarSalaryTicker } from '../../ui/salary-ticker.js';
import { escapeHtml as esc, openModal } from '../../ui/modal.js';

const EXPENSE_CATEGORIES = ['식비', '교통', '카페', '쇼핑', '월세', '주거통신', '의료', '문화', '기타'];
const INCOME_CATEGORIES = ['월급', '부수입', '용돈', '이자/배당', '기타'];

const CATEGORY_ICONS = {
    '식비': '🍚',
    '교통': '🚌',
    '카페': '☕',
    '쇼핑': '🛍️',
    '월세': '🏠',
    '주거통신': '📶',
    '의료': '🏥',
    '문화': '🎭',
    '기타': '📦',
    '월급': '💼',
    '부수입': '💵',
    '용돈': '🎁',
    '이자/배당': '📈'
};

export function categoryIcon(category) {
    return CATEGORY_ICONS[category] || '🏷️';
}

const COLOR_TAGS = [
    { key: 'blue', hex: '#2563eb' },
    { key: 'indigo', hex: '#4f46e5' },
    { key: 'purple', hex: '#7c3aed' },
    { key: 'pink', hex: '#db2777' },
    { key: 'red', hex: '#dc2626' },
    { key: 'orange', hex: '#f59e0b' },
    { key: 'yellow', hex: '#ca8a04' },
    { key: 'green', hex: '#16a34a' },
    { key: 'teal', hex: '#0d9488' },
    { key: 'gray', hex: '#64748b' },
];

function colorTagHex(key) {
    return (COLOR_TAGS.find(c => c.key === key) || COLOR_TAGS[0]).hex;
}

const ICON_CALENDAR = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
const ICON_LIST = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`;
const ICON_WALLET = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>`;
const ICON_EVENT = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="8" cy="15" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="15" r="1" fill="currentColor" stroke="none"/><circle cx="16" cy="15" r="1" fill="currentColor" stroke="none"/></svg>`;

function categoriesForType(type) {
    return type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}

function pad2(n) { return String(n).padStart(2, '0'); }
function ymd(year, month, day) { return `${year}-${pad2(month)}-${pad2(day)}`; }
function todayYmd() {
    const d = new Date();
    return ymd(d.getFullYear(), d.getMonth() + 1, d.getDate());
}
function won(n) { return `${Number(n || 0).toLocaleString('ko-KR')}원`; }


function formatAmountInput(el) {
    const digits = el.value.replace(/[^\d]/g, '');
    el.value = digits ? Number(digits).toLocaleString('ko-KR') : '';
}
function parseAmountInput(el) {
    return Number(el.value.replace(/[^\d]/g, '')) || 0;
}

/**
 * @param {object} [options]
 * @param {number} [options.sharedCalendarId] 공유 캘린더 id — 주면 공유 캘린더 모드
 *   (같은 화면을 쓰되 데이터는 /api/shared-calendars/{id}/ledger, /schedule 에서 읽고 쓰며
 *    작성자 이름을 보여주고, 개인 전용 기능(상단 급여 게이지 갱신)은 뺀다)
 */
export default function LedgerPage(options = {}) {

    const now = new Date();
    const sharedId = options.sharedCalendarId || null;
    const isShared = !!sharedId;
    const API = isShared
        ? { ledger: `/api/shared-calendars/${sharedId}/ledger`, schedule: `/api/shared-calendars/${sharedId}/schedule` }
        : { ledger: '/api/money/ledger', schedule: '/api/schedule' };

    /** 개인 가계부가 바뀌었을 때만 상단 급여/지출 게이지 갱신 (공유 가계부는 개인 통계와 따로) */
    function refreshPersonalTicker() {
        if (!isShared) initTopbarSalaryTicker();
    }

    /** 공유 캘린더: 누가 입력했는지 */
    function authorHtml(item) {
        if (!isShared || !item.authorDisplayName) return '';
        return `<span class="ledger-tx-author" title="작성자">${esc(item.authorDisplayName)}</span>`;
    }

    const VIEW_MODE_KEY = 'growtive-ledger-view';
    const MODE_KEY = 'growtive-ledger-mode';

    const state = {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        transactions: [],        // 이번 달 전체 (가계부)
        byDate: {},               // { 'YYYY-MM-DD': [tx, ...] }
        events: [],               // 이번 달 전체 (일정)
        eventsByDate: {},         // { 'YYYY-MM-DD': [event, ...] }
        selectedDate: todayYmd(),
        selectedRangeStart: null,
        selectedRangeEnd: null,
        editingId: null,
        editingOriginalRecurring: false,
        editingEventId: null,
        viewMode: localStorage.getItem(VIEW_MODE_KEY) === 'list' ? 'list' : 'calendar',
        mode: localStorage.getItem(MODE_KEY) === 'schedule' ? 'schedule' : 'money',
        // 💸 정산 날짜 선택 (공유 캘린더 전용, 저장하지 않음)
        settle: { active: false, picked: new Map() }, // picked: { 'YYYY-MM-DD': [그날 지출 tx] }
    };

    // 🔗 다른 화면(재무 대시보드 > 자산 내역)에서 '#/calendar?date=YYYY-MM-DD&edit=ID'로 들어오면
    //    해당 날짜의 가계부를 열고, edit가 있으면 그 내역의 수정 폼을 바로 띄운다.
    const linkParams = new URLSearchParams(isShared ? '' : (location.hash.split('?')[1] || ''));
    const linkDate = linkParams.get('date');
    const linkEditId = Number(linkParams.get('edit')) || null;
    if (linkDate && /^\d{4}-\d{2}-\d{2}$/.test(linkDate)) {
        state.year = Number(linkDate.slice(0, 4));
        state.month = Number(linkDate.slice(5, 7));
        state.selectedDate = linkDate;
        state.mode = 'money';
        // 새로고침 시 수정 폼이 또 열리지 않도록 주소는 깨끗하게 (replaceState는 hashchange 안 일으킴)
        history.replaceState(null, '', '#/calendar');
    }

    function isSchedule() { return state.mode === 'schedule'; }

    function gridContainerClass() {
        if (state.viewMode === 'list') return 'ledger-list-wrap';
        return isSchedule() ? 'ledger-grid ledger-grid--schedule' : 'ledger-grid';
    }

    function groupByDate() {
        state.byDate = {};
        for (const tx of state.transactions) {
            const key = tx.date;
            (state.byDate[key] ||= []).push(tx);
        }
    }

    function dateRange(startStr, endStr) {
        const dates = [];
        const cur = new Date(startStr + 'T00:00:00');
        const end = new Date(endStr + 'T00:00:00');
        while (cur <= end) {
            dates.push(ymd(cur.getFullYear(), cur.getMonth() + 1, cur.getDate()));
            cur.setDate(cur.getDate() + 1);
        }
        return dates;
    }

    function groupEventsByDate() {
        state.eventsByDate = {};
        for (const ev of state.events) {
            for (const dateStr of dateRange(ev.startDate, ev.endDate)) {
                (state.eventsByDate[dateStr] ||= []).push(ev);
            }
        }
    }

    function dayTotal(dateStr) {
        const list = state.byDate[dateStr] || [];
        let income = 0, expense = 0;
        for (const tx of list) {
            if (tx.type === 'INCOME') income += Number(tx.amount);
            else expense += Number(tx.amount);
        }
        return { income, expense };
    }

    function monthTotal() {
        let income = 0, expense = 0;
        for (const tx of state.transactions) {
            if (tx.type === 'INCOME') income += Number(tx.amount);
            else expense += Number(tx.amount);
        }
        return { income, expense };
    }

    async function loadMonth() {
        const { data } = await axios.get(API.ledger, {
            params: { year: state.year, month: state.month }
        });
        state.transactions = data;
        groupByDate();
    }

    async function loadEvents() {
        const { data } = await axios.get(API.schedule, {
            params: { year: state.year, month: state.month }
        });
        state.events = data;
        groupEventsByDate();
    }

    function calendarCells() {
        const first = new Date(state.year, state.month - 1, 1);
        const startWeekday = first.getDay(); // 0=일
        const daysInMonth = new Date(state.year, state.month, 0).getDate();

        const cells = [];
        for (let i = 0; i < startWeekday; i++) cells.push(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push(d);
        return cells;
    }

    function weekdayHeadersHtml() {
        return ['일', '월', '화', '수', '목', '금', '토']
            .map((w, i) => {
                const cls = i === 0 ? ' ledger-weekday--sunday' : (i === 6 ? ' ledger-weekday--saturday' : '');
                return `<div class="ledger-weekday${cls}">${w}</div>`;
            }).join('');
    }

    function cellClasses(dateStr, idx) {
        const today = todayYmd();
        const isSelected = dateStr === state.selectedDate;
        const isToday = dateStr === today;
        const weekday = idx % 7; // 0=일, 6=토
        const holidayName = HOLIDAYS[dateStr];

        const inSelectedRange = state.selectedRangeStart && state.selectedRangeEnd
            && dateStr >= state.selectedRangeStart && dateStr <= state.selectedRangeEnd;

        const classes = ['ledger-cell'];
        if (isSelected) classes.push('ledger-cell--selected');
        if (inSelectedRange) classes.push('ledger-cell--range-selected');
        if (isToday) classes.push('ledger-cell--today');
        if (state.settle.active && state.settle.picked.has(dateStr)) classes.push('ledger-cell--settle-picked');
        if (holidayName) classes.push('ledger-cell--holiday');
        else if (weekday === 0) classes.push('ledger-cell--sunday');
        else if (weekday === 6) classes.push('ledger-cell--saturday');
        return { classes, holidayName };
    }

    function renderCalendarGrid() {
        const cellsHtml = calendarCells().map((day, idx) => {
            if (day === null) return `<div class="ledger-cell ledger-cell--empty"></div>`;
            const dateStr = ymd(state.year, state.month, day);
            const { income, expense } = dayTotal(dateStr);
            const { classes, holidayName } = cellClasses(dateStr, idx);

            return `
                <div class="${classes.join(' ')}" data-date="${dateStr}"${holidayName ? ` title="${holidayName}"` : ''}>
                    <div class="ledger-cell-day">${day}</div>
                    ${holidayName ? `<div class="ledger-cell-holiday-name">${holidayName}</div>` : ''}
                    ${expense > 0 ? `<div class="ledger-cell-expense">-${won(expense)}</div>` : ''}
                    ${income > 0 ? `<div class="ledger-cell-income">+${won(income)}</div>` : ''}
                </div>`;
        }).join('');

        return weekdayHeadersHtml() + cellsHtml;
    }

    const MAX_EVENT_LANES = 2;

    // 여러 날에 걸친 일정끼리 겹치지 않도록 "레인"을 배정한다 (구글 캘린더 월간뷰와 같은 방식).
    function computeMultiDayLanes() {
        const multiDay = state.events.filter(ev => ev.startDate !== ev.endDate);
        const sorted = [...multiDay].sort((a, b) => {
            if (a.startDate !== b.startDate) return a.startDate < b.startDate ? -1 : 1;
            return a.endDate < b.endDate ? 1 : -1; // 시작일이 같으면 더 긴 일정을 위 레인에
        });
        const laneEnds = [];
        const laneOf = new Map();
        sorted.forEach(ev => {
            let laneIdx = laneEnds.findIndex(end => end < ev.startDate);
            if (laneIdx === -1) laneIdx = laneEnds.length;
            laneEnds[laneIdx] = ev.endDate;
            laneOf.set(ev.id, laneIdx);
        });
        return { laneOf, laneCount: laneEnds.length };
    }

    function renderScheduleCalendarGrid() {
        const MAX_TITLES = 3;
        const { laneOf, laneCount } = computeMultiDayLanes();
        const visibleLanes = Math.min(laneCount, MAX_EVENT_LANES);

        const cellsHtml = calendarCells().map((day, idx) => {
            if (day === null) return `<div class="ledger-cell ledger-cell--empty"></div>`;
            const dateStr = ymd(state.year, state.month, day);
            const dayEvents = state.eventsByDate[dateStr] || [];
            const { classes, holidayName } = cellClasses(dateStr, idx);

            const multiDayEvents = dayEvents.filter(ev => ev.startDate !== ev.endDate);
            const singleDayEvents = dayEvents.filter(ev => ev.startDate === ev.endDate);

            let barsHtml = '';
            for (let lane = 0; lane < visibleLanes; lane++) {
                const ev = multiDayEvents.find(e => laneOf.get(e.id) === lane);
                if (!ev) {
                    barsHtml += `<div class="ledger-event-bar-spacer"></div>`;
                    continue;
                }
                const isStart = dateStr === ev.startDate;
                const isEnd = dateStr === ev.endDate;
                const cls = `${isStart ? ' is-start' : ''}${isEnd ? ' is-end' : ''}`;
                barsHtml += `<div class="ledger-event-bar${cls}" style="background:${colorTagHex(ev.colorTag)}" title="${esc(ev.title)}">${isStart ? `<span class="ledger-event-bar-label">${esc(ev.title)}</span>` : ''}</div>`;
            }
            const laneOverflow = multiDayEvents.filter(ev => laneOf.get(ev.id) >= MAX_EVENT_LANES).length;
            if (laneOverflow > 0) {
                barsHtml += `<span class="ledger-event-more">+${laneOverflow}</span>`;
            }

            const titlesHtml = singleDayEvents.slice(0, MAX_TITLES).map(ev => `
                <div class="ledger-event-title-mini" title="${esc(ev.title)}">
                    <span class="ledger-event-dot" style="background:${colorTagHex(ev.colorTag)}"></span>${esc(ev.title)}
                </div>`).join('');
            const titleOverflow = singleDayEvents.length > MAX_TITLES
                ? `<div class="ledger-event-more">+${singleDayEvents.length - MAX_TITLES}건 더</div>` : '';

            return `
                <div class="${classes.join(' ')}" data-date="${dateStr}"${holidayName ? ` title="${holidayName}"` : ''}>
                    <div class="ledger-cell-day">${day}</div>
                    ${holidayName ? `<div class="ledger-cell-holiday-name">${holidayName}</div>` : ''}
                    ${barsHtml ? `<div class="ledger-event-bars">${barsHtml}</div>` : ''}
                    ${(titlesHtml || titleOverflow) ? `<div class="ledger-event-titles">${titlesHtml}${titleOverflow}</div>` : ''}
                </div>`;
        }).join('');

        return weekdayHeadersHtml() + cellsHtml;
    }

    function renderListView() {
        const dates = Object.keys(state.byDate).sort();
        if (dates.length === 0) {
            return `<div class="hint">이번 달 등록된 내역이 없습니다.</div>`;
        }
        return `<div class="ledger-list-view">${dates.map(dateStr => {
            const list = [...state.byDate[dateStr]].sort((a, b) => a.id - b.id);
            const { income, expense } = dayTotal(dateStr);
            const isSelected = dateStr === state.selectedDate;
            const dayNum = Number(dateStr.split('-')[2]);
            const weekday = new Date(dateStr).getDay();
            const weekdayName = ['일', '월', '화', '수', '목', '금', '토'][weekday];
            const holidayName = HOLIDAYS[dateStr];

            const dateClasses = ['ledger-list-date'];
            if (holidayName) dateClasses.push('ledger-list-date--holiday');
            else if (weekday === 0) dateClasses.push('ledger-list-date--sunday');
            else if (weekday === 6) dateClasses.push('ledger-list-date--saturday');

            return `
            <div class="ledger-list-group${isSelected ? ' is-selected' : ''}${state.settle.active && state.settle.picked.has(dateStr) ? ' is-settle-picked' : ''}" data-date="${dateStr}">
                <div class="ledger-list-date-row">
                    <span class="${dateClasses.join(' ')}">${dayNum}일 (${weekdayName})${holidayName ? ` · ${holidayName}` : ''}</span>
                    <span class="ledger-list-date-total">
                        ${income > 0 ? `<b class="is-income">+${won(income)}</b>` : ''}
                        ${expense > 0 ? `<b class="is-expense">-${won(expense)}</b>` : ''}
                    </span>
                </div>
                <ul class="ledger-list-items">
                    ${list.map(tx => `
                        <li class="ledger-list-item">
                            <span class="ledger-list-item-category">${categoryIcon(tx.category)} ${esc(tx.category)}${(tx.recurring || tx.recurringOriginId) ? ' <span class="ledger-tx-recurring-badge" title="매달 반복">🔁</span>' : ''}</span>
                            <span class="ledger-list-item-memo">${authorHtml(tx)}${esc(tx.memo)}</span>
                            <span class="ledger-list-item-amount ${tx.type === 'INCOME' ? 'is-income' : 'is-expense'}">${tx.type === 'INCOME' ? '+' : '-'}${won(tx.amount)}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>`;
        }).join('')}</div>`;
    }

    function renderScheduleListView() {
        const byDate = {};
        for (const ev of state.events) {
            (byDate[ev.startDate] = byDate[ev.startDate] || []).push(ev);
        }
        const dates = Object.keys(byDate).sort();
        if (dates.length === 0) {
            return `<div class="hint">이번 달 등록된 일정이 없습니다.</div>`;
        }
        return `<div class="ledger-list-view">${dates.map(dateStr => {
            const list = [...byDate[dateStr]].sort((a, b) => {
                if (!a.time) return 1;
                if (!b.time) return -1;
                return a.time.localeCompare(b.time);
            });
            const isSelected = dateStr === state.selectedDate;
            const dayNum = Number(dateStr.split('-')[2]);
            const weekday = new Date(dateStr).getDay();
            const weekdayName = ['일', '월', '화', '수', '목', '금', '토'][weekday];
            const holidayName = HOLIDAYS[dateStr];

            const dateClasses = ['ledger-list-date'];
            if (holidayName) dateClasses.push('ledger-list-date--holiday');
            else if (weekday === 0) dateClasses.push('ledger-list-date--sunday');
            else if (weekday === 6) dateClasses.push('ledger-list-date--saturday');

            return `
            <div class="ledger-list-group${isSelected ? ' is-selected' : ''}" data-date="${dateStr}">
                <div class="ledger-list-date-row">
                    <span class="${dateClasses.join(' ')}">${dayNum}일 (${weekdayName})${holidayName ? ` · ${holidayName}` : ''}</span>
                </div>
                <ul class="ledger-list-items">
                    ${list.map(ev => `
                        <li class="ledger-list-item">
                            <span class="ledger-list-item-category"><span class="ledger-event-dot" style="background:${colorTagHex(ev.colorTag)}"></span> ${esc(ev.title)}${eventRangeBadge(ev)}</span>
                            <span class="ledger-list-item-memo">${authorHtml(ev)}${ev.time ? `${ev.time.slice(0, 5)} · ` : ''}${esc(ev.memo)}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>`;
        }).join('')}</div>`;
    }

    function renderMainView() {
        if (isSchedule()) {
            return state.viewMode === 'list' ? renderScheduleListView() : renderScheduleCalendarGrid();
        }
        return state.viewMode === 'list' ? renderListView() : renderCalendarGrid();
    }

    function renderDayTotalsHtml(dateStr) {
        const { income, expense } = dayTotal(dateStr);
        if (income === 0 && expense === 0) return '';
        const net = income - expense;
        return `
            <span class="ledger-day-chip is-income">수입 +${won(income)}</span>
            <span class="ledger-day-chip is-expense">지출 -${won(expense)}</span>
            <span class="ledger-day-chip ledger-day-net ${net >= 0 ? 'is-income' : 'is-expense'}">합계 ${net >= 0 ? '+' : '-'}${won(Math.abs(net))}</span>
        `;
    }

    function renderDayList() {
        const list = state.byDate[state.selectedDate] || [];
        if (list.length === 0) {
            return `<div class="hint">이 날짜에 등록된 내역이 없습니다.</div>`;
        }
        const sortable = isShared && list.length > 1;
        return `${sortable ? '<p class="ledger-reorder-hint">꾹 누른 채로 끌어서 순서를 바꿀 수 있어요</p>' : ''}
        <ul class="ledger-tx-list${sortable ? ' is-sortable' : ''}">${list.map(tx => {
            const isOrigin = tx.recurring && !tx.recurringOriginId;
            const isRecurringRelated = tx.recurring || tx.recurringOriginId;
            return `
            <li class="ledger-tx-item" data-id="${tx.id}">
                <div class="ledger-tx-main">
                    <span class="ledger-tx-category">${categoryIcon(tx.category)} ${esc(tx.category)}${isRecurringRelated ? ' <span class="ledger-tx-recurring-badge" title="매달 반복">🔁</span>' : ''}</span>
                    <span class="ledger-tx-amount ${tx.type === 'INCOME' ? 'is-income' : 'is-expense'}">
                        ${tx.type === 'INCOME' ? '+' : '-'}${won(tx.amount)}
                    </span>
                </div>
                <div class="ledger-tx-sub">
                    <span class="ledger-tx-memo">${authorHtml(tx)}${esc(tx.memo)}</span>
                    <span class="ledger-tx-actions">
                        <button class="btn btn-xs" data-edit="${tx.id}">수정</button>
                        <button class="btn btn-xs" data-copy="${tx.id}">복사</button>
                        ${isOrigin ? `<button class="btn btn-xs" data-stop="${tx.id}">반복 중지</button>` : ''}
                        <button class="btn btn-xs btn-danger" data-del="${tx.id}">삭제</button>
                    </span>
                </div>
            </li>`;
        }).join('')}</ul>`;
    }

    function formatMonthDay(dateStr) {
        const [, m, d] = dateStr.split('-');
        return `${Number(m)}/${Number(d)}`;
    }

    function eventRangeBadge(ev) {
        if (ev.startDate === ev.endDate) return '';
        return ` <span class="ledger-event-range">${formatMonthDay(ev.startDate)} ~ ${formatMonthDay(ev.endDate)}</span>`;
    }

    function renderEventDayList() {
        const list = [...(state.eventsByDate[state.selectedDate] || [])].sort((a, b) => {
            if (!a.time) return 1;
            if (!b.time) return -1;
            return a.time.localeCompare(b.time);
        });
        if (list.length === 0) {
            return `<div class="hint">이 날짜에 등록된 일정이 없습니다.</div>`;
        }
        return `<ul class="ledger-tx-list">${list.map(ev => `
            <li class="ledger-tx-item">
                <div class="ledger-tx-main">
                    <span class="ledger-tx-category"><span class="ledger-event-dot" style="background:${colorTagHex(ev.colorTag)}"></span> ${esc(ev.title)}${eventRangeBadge(ev)}</span>
                    ${ev.time ? `<span class="ledger-event-time">${ev.time.slice(0, 5)}</span>` : ''}
                </div>
                <div class="ledger-tx-sub">
                    <span class="ledger-tx-memo">${authorHtml(ev)}${esc(ev.memo)}</span>
                    <span class="ledger-tx-actions">
                        <button class="btn btn-xs" data-edit-event="${ev.id}">수정</button>
                        <button class="btn btn-xs" data-copy-event="${ev.id}">복사</button>
                        <button class="btn btn-xs btn-danger" data-del-event="${ev.id}">삭제</button>
                    </span>
                </div>
            </li>`).join('')}</ul>`;
    }

    function categoryOptions(type) {
        return categoriesForType(type).map(c => `<option value="${c}">${categoryIcon(c)} ${c}</option>`).join('')
            + `<option value="__custom__">✏️ 직접 입력</option>`;
    }

    function moneyFormHtml() {
        return `
            <form id="txForm" class="form">
                <div class="btn-row">
                    <label><input type="radio" name="txType" value="EXPENSE" checked> 지출</label>
                    <label><input type="radio" name="txType" value="INCOME"> 수입</label>
                </div>
                <select id="txCategory">${categoryOptions('EXPENSE')}</select>
                <input id="txCategoryCustom" type="text" placeholder="카테고리 이름 입력" style="display:none;">
                <input id="txAmount" type="text" inputmode="numeric" placeholder="금액" required>
                <input id="txMemo" type="text" placeholder="메모 (선택)">
                <label class="ledger-recurring-label" id="txRecurringLabel">
                    <input type="checkbox" id="txRecurring"> 매달 반복 (월급/월세 등 고정 항목)
                </label>
                <div class="btn-row">
                    <button type="submit" id="txSubmitBtn" class="btn btn-primary">추가</button>
                    <button type="button" id="txCancelBtn" class="btn btn-ghost" style="display:none;">취소</button>
                </div>
            </form>`;
    }

    function eventFormHtml() {
        const swatches = COLOR_TAGS.map((c, i) => `
            <button type="button" class="ledger-color-swatch${i === 0 ? ' is-selected' : ''}" data-color="${c.key}" style="background:${c.hex}" title="${c.key}"></button>
        `).join('');
        return `
            <form id="eventForm" class="form">
                <input id="evtTitle" type="text" placeholder="일정 제목" required>
                <div class="ledger-daterange">
                    <input id="evtStartDate" type="date" required>
                    <span class="ledger-daterange-sep">~</span>
                    <input id="evtEndDate" type="date" required>
                </div>
                <input id="evtTime" type="time" placeholder="시간 (선택)">
                <input id="evtMemo" type="text" placeholder="메모 (선택)">
                <input type="hidden" id="evtColorTag" value="blue">
                <div class="ledger-color-picker" id="evtColorPicker">${swatches}</div>
                <div class="btn-row">
                    <button type="submit" id="evtSubmitBtn" class="btn btn-primary">추가</button>
                    <button type="button" id="evtCancelBtn" class="btn btn-ghost" style="display:none;">취소</button>
                </div>
            </form>`;
    }

    // 바깥(공유 캘린더 상단 카드)에서 부를 수 있는 동작 — onMounted 후 채워짐
    const api = {
        title: isShared ? '공유 캘린더' : '가계부',
        startSettle() {},

        render() {
            return `
            <section class="ledger-page">
                ${isShared ? `
                <div class="settle-bar" id="settleBar" hidden>
                    <div class="settle-bar-text">
                        <b>정산할 날짜를 골라주세요</b>
                        <span id="settleBarInfo">2초 꾹 누른 채 끌면 여러 날 한 번에</span>
                    </div>
                    <div class="settle-bar-btns">
                        <button type="button" class="btn btn-ghost btn-sm" id="settleCancelBtn">끝내기</button>
                        <button type="button" class="btn btn-primary btn-sm" id="settleRunBtn" disabled>정산하기</button>
                    </div>
                </div>` : ''}
                <div class="card">
                    <div class="ledger-header">
                        <div class="ledger-month-nav">
                            <button id="prevMonth" class="ledger-nav-btn" type="button" aria-label="이전 달">◀</button>
                            <h2 id="monthLabel">${state.year}년 ${state.month}월</h2>
                            <button id="nextMonth" class="ledger-nav-btn" type="button" aria-label="다음 달">▶</button>
                        </div>
                        <div class="ledger-header-controls">
                            <div class="ledger-switch" id="viewSwitch">
                                <button type="button" class="ledger-switch-btn${state.viewMode !== 'list' ? ' is-active' : ''}" data-view="calendar">${ICON_CALENDAR} 달력</button>
                                <button type="button" class="ledger-switch-btn${state.viewMode === 'list' ? ' is-active' : ''}" data-view="list">${ICON_LIST} 목록</button>
                            </div>
                            <div class="ledger-switch" id="modeSwitch">
                                <button type="button" class="ledger-switch-btn${!isSchedule() ? ' is-active' : ''}" data-mode="money">${ICON_WALLET} 가계부</button>
                                <button type="button" class="ledger-switch-btn${isSchedule() ? ' is-active' : ''}" data-mode="schedule">${ICON_EVENT} 일정</button>
                            </div>
                        </div>
                    </div>
                    <div class="ledger-summary" id="monthSummary" style="${isSchedule() ? 'display:none;' : ''}"></div>
                    <div class="${gridContainerClass()}" id="calendarGrid">${renderMainView()}</div>
                </div>

                <div class="card">
                    <div class="ledger-day-header">
                        <h3 id="dayPanelTitle">${state.selectedDate}</h3>
                        <div class="ledger-day-totals" id="dayTotals">${isSchedule() ? '' : renderDayTotalsHtml(state.selectedDate)}</div>
                    </div>
                    <h4 class="ledger-section-label" id="daySectionLabel">${isSchedule() ? '등록된 일정' : '등록된 내역'}</h4>
                    <div id="dayTxList">${isSchedule() ? renderEventDayList() : renderDayList()}</div>
                    <div class="ledger-form-panel">
                        <button type="button" class="ledger-form-toggle-btn" id="formToggleBtn">
                            <span id="formToggleBtnText">+ ${isSchedule() ? '일정' : '내역'} 추가</span>
                        </button>
                        <div id="entryFormWrap" style="display:none;">
                            <div id="entryFormArea">${isSchedule() ? eventFormHtml() : moneyFormHtml()}</div>
                        </div>
                    </div>
                </div>
            </section>`;
        },

        async onMounted() {
            const $ = (id) => document.getElementById(id);

            function renderMonthSummary() {
                const { income, expense } = monthTotal();
                $('monthSummary').innerHTML = `
                    <div>이번 달 수입 <b class="is-income">${won(income)}</b></div>
                    <div>이번 달 지출 <b class="is-expense">${won(expense)}</b></div>
                `;
            }

            /* ---------------- 일정 캘린더 드래그 선택 ---------------- */

            const dragState = { active: false, startDate: null, currentDate: null };

            function cellAtPoint(clientX, clientY) {
                const el = document.elementFromPoint(clientX, clientY);
                const cell = el && el.closest && el.closest('.ledger-cell[data-date]');
                return cell ? cell.dataset.date : null;
            }

            function applyDragHighlight() {
                if (!dragState.startDate || !dragState.currentDate) return;
                const lo = dragState.startDate < dragState.currentDate ? dragState.startDate : dragState.currentDate;
                const hi = dragState.startDate < dragState.currentDate ? dragState.currentDate : dragState.startDate;
                $('calendarGrid').querySelectorAll('.ledger-cell[data-date]').forEach(cell => {
                    const d = cell.dataset.date;
                    cell.classList.toggle('ledger-cell--drag', d >= lo && d <= hi);
                });
            }

            function clearDragHighlight() {
                $('calendarGrid').querySelectorAll('.ledger-cell--drag').forEach(cell => cell.classList.remove('ledger-cell--drag'));
            }

            function selectDateRange(lo, hi) {
                state.selectedDate = lo;
                state.selectedRangeStart = lo;
                state.selectedRangeEnd = hi;
                resetEventForm();
                $('evtEndDate').value = hi;
                setFormOpen(false);
                renderCalendar();
                renderDayPanel();
            }

            function finalizeDrag() {
                if (!dragState.active) return;
                dragState.active = false;
                if (!dragState.startDate) return;
                const endDate = dragState.currentDate || dragState.startDate;
                const lo = dragState.startDate < endDate ? dragState.startDate : endDate;
                const hi = dragState.startDate < endDate ? endDate : dragState.startDate;
                dragState.startDate = null;
                dragState.currentDate = null;
                clearDragHighlight();
                selectDateRange(lo, hi);
            }

            $('calendarGrid').addEventListener('pointermove', (e) => {
                if (!dragState.active) return;
                const d = cellAtPoint(e.clientX, e.clientY);
                if (d && d !== dragState.currentDate) {
                    dragState.currentDate = d;
                    applyDragHighlight();
                }
            });

            document.addEventListener('pointerup', () => finalizeDrag());
            document.addEventListener('pointercancel', () => finalizeDrag());

            function renderCalendar() {
                const container = $('calendarGrid');
                container.className = gridContainerClass();
                container.innerHTML = renderMainView();

                if (isSchedule() && state.viewMode !== 'list') {
                    container.querySelectorAll('.ledger-cell[data-date]').forEach(cell => {
                        cell.addEventListener('pointerdown', (e) => {
                            e.preventDefault();
                            dragState.active = true;
                            dragState.startDate = cell.dataset.date;
                            dragState.currentDate = cell.dataset.date;
                            applyDragHighlight();
                        });
                    });
                } else {
                    container.querySelectorAll('[data-date]').forEach(el => {
                        el.addEventListener('click', () => {
                            if (state.settle.active) {
                                if (settleDrag.suppressClick) { settleDrag.suppressClick = false; return; }
                                toggleSettleDate(el.dataset.date);
                            }
                            else selectDate(el.dataset.date);
                        });
                    });
                }
            }

            /* ---------------- 💸 정산 날짜 선택 (공유 캘린더) ---------------- */

            const expensesOn = (dateStr) => (state.byDate[dateStr] || []).filter(tx => tx.type === 'EXPENSE');

            function updateSettleBar() {
                if (!isShared) return;
                const { active, picked } = state.settle;
                $('settleBar').hidden = !active;
                const startBtn = document.getElementById('settleStartBtn'); // 공유 캘린더 상단 카드의 버튼
                if (startBtn) startBtn.disabled = active;
                document.body.classList.toggle('is-settle-selecting', active);
                if (!active) return;
                let total = 0;
                picked.forEach(list => list.forEach(tx => { total += Number(tx.amount) || 0; }));
                $('settleBarInfo').innerHTML = picked.size
                    ? `${picked.size}일 선택 · 지출 <b class="is-expense">${won(total)}</b>`
                    : '2초 꾹 누른 채 끌면 여러 날 한 번에';
                $('settleRunBtn').disabled = picked.size === 0;
            }

            function toggleSettleDate(dateStr) {
                const { picked } = state.settle;
                if (picked.has(dateStr)) picked.delete(dateStr);
                else picked.set(dateStr, expensesOn(dateStr));
                renderCalendar();
                updateSettleBar();
            }

            /*
             * 꾹 눌러(2초) 여러 날짜 한 번에 고르기
             * - 날짜를 2초 이상 누르고 있으면 드래그 모드 → 손가락(마우스)이 지나간 시작~현재 날짜까지 한 번에 선택
             * - 시작한 날짜가 이미 골라져 있었으면 반대로 그 범위를 해제
             * - 2초 전에 손을 움직이면 화면 스크롤로 보고 취소, 2초 전에 떼면 평소처럼 한 날짜만 체크
             */
            const SETTLE_HOLD_MS = 2000;
            const settleDrag = { timer: null, pointerId: null, startX: 0, startY: 0, start: null, current: null,
                                 active: false, removing: false, suppressClick: false };

            function settleRange(a, b) {
                const lo = a < b ? a : b, hi = a < b ? b : a;
                return [...$('calendarGrid').querySelectorAll('.ledger-cell[data-date]')]
                    .map(c => c.dataset.date).filter(d => d >= lo && d <= hi);
            }

            function paintSettleDrag() {
                const inRange = new Set(settleRange(settleDrag.start, settleDrag.current));
                $('calendarGrid').querySelectorAll('.ledger-cell[data-date]').forEach(cell => {
                    const on = inRange.has(cell.dataset.date);
                    cell.classList.toggle('ledger-cell--settle-drag', on && !settleDrag.removing);
                    cell.classList.toggle('ledger-cell--settle-undrag', on && settleDrag.removing);
                });
            }

            function cancelSettleHold() {
                clearTimeout(settleDrag.timer);
                settleDrag.timer = null;
                $('calendarGrid').querySelectorAll('.ledger-cell--settle-holding').forEach(c => c.classList.remove('ledger-cell--settle-holding'));
            }

            function finishSettleDrag(apply) {
                cancelSettleHold();
                if (!settleDrag.active) return;
                settleDrag.active = false;
                document.body.classList.remove('is-settle-dragging');
                setTimeout(() => { settleDrag.suppressClick = false; }, 400); // 손 뗀 직후 클릭만 무시
                if (apply) {
                    for (const d of settleRange(settleDrag.start, settleDrag.current)) {
                        if (settleDrag.removing) state.settle.picked.delete(d);
                        else state.settle.picked.set(d, expensesOn(d));
                    }
                }
                renderCalendar();
                updateSettleBar();
            }

            $('calendarGrid').addEventListener('pointerdown', (e) => {
                if (!state.settle.active || state.viewMode === 'list' || isSchedule()) return;
                const cell = e.target.closest('.ledger-cell[data-date]');
                if (!cell) return;
                cancelSettleHold();
                Object.assign(settleDrag, { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY,
                                            start: cell.dataset.date, current: cell.dataset.date });
                cell.classList.add('ledger-cell--settle-holding'); // 누르고 있는 동안 표시 (2초 차오름)
                settleDrag.timer = setTimeout(() => {
                    settleDrag.timer = null;
                    cell.classList.remove('ledger-cell--settle-holding');
                    settleDrag.active = true;
                    settleDrag.removing = state.settle.picked.has(settleDrag.start);
                    settleDrag.suppressClick = true; // 손 뗄 때 생기는 클릭은 무시
                    document.body.classList.add('is-settle-dragging');
                    try { navigator.vibrate?.(30); } catch { /* 진동 미지원 */ }
                    paintSettleDrag();
                }, SETTLE_HOLD_MS);
            });

            $('calendarGrid').addEventListener('pointermove', (e) => {
                if (e.pointerId !== settleDrag.pointerId) return;
                if (settleDrag.timer && Math.hypot(e.clientX - settleDrag.startX, e.clientY - settleDrag.startY) > 10) {
                    cancelSettleHold(); // 2초 전에 움직이면 스크롤
                    return;
                }
                if (!settleDrag.active) return;
                const d = cellAtPoint(e.clientX, e.clientY);
                if (d && d !== settleDrag.current) {
                    settleDrag.current = d;
                    paintSettleDrag();
                }
            });

            document.addEventListener('pointerup', (e) => {
                if (e.pointerId !== settleDrag.pointerId) return;
                if (settleDrag.active) finishSettleDrag(true); else cancelSettleHold();
            });
            document.addEventListener('pointercancel', (e) => {
                if (e.pointerId !== settleDrag.pointerId) return;
                finishSettleDrag(true);
            });
            // 드래그 중에는 화면이 같이 스크롤되지 않게
            $('calendarGrid').addEventListener('touchmove', (e) => { if (settleDrag.active) e.preventDefault(); }, { passive: false });
            $('calendarGrid').addEventListener('contextmenu', (e) => { if (state.settle.active) e.preventDefault(); });

            api.startSettle = startSettle;

            function startSettle() {
                if (state.settle.active) return;
                // 정산은 가계부 기준 → 일정 보기였으면 가계부로
                if (isSchedule()) $('modeSwitch').querySelector('button[data-mode="money"]').click();
                state.settle.active = true;
                state.settle.picked = new Map();
                renderCalendar();
                updateSettleBar();
            }

            function endSettle() {
                state.settle.active = false;
                state.settle.picked = new Map();
                renderCalendar();
                updateSettleBar();
            }

            if (isShared) {
                $('settleCancelBtn').addEventListener('click', endSettle);
                $('settleRunBtn').addEventListener('click', () => {
                    const dates = [...state.settle.picked.keys()].sort();
                    const transactions = dates.flatMap(d => state.settle.picked.get(d));
                    options.onSettle?.({ dates, transactions });
                });
                // 다른 화면으로 나가면 선택 모드 표시(하단 바 여백) 해제
                window.addEventListener('hashchange', () => document.body.classList.remove('is-settle-selecting'), { once: true });
            }

            /* ---------------- 가계부 내역을 다른 캘린더로 복사 ---------------- */

            /**
             * [복사] → 복사할 캘린더(지금 캘린더 / 내 캘린더 / 참여 중인 공유 캘린더)를 여러 개 골라
             * 같은 날짜(바꿀 수 있음)에 같은 내역을 새로 만든다. 지금 캘린더를 고르면 다른 날짜로 복제할 때 유용.
             * - 각 캘린더의 '추가' API를 그대로 쓰므로 공유 캘린더는 서버가 참여자인지 확인
             * - 복사본은 원본과 독립된 새 내역 (반복 항목도 한 건만), 공유 캘린더에서는 작성자 '나'·순서 맨 뒤
             */
            /** 시작일~종료일 일수 (같은 날이면 1) */
            function daysBetweenYmd(startStr, endStr) {
                const ms = new Date(endStr + 'T00:00:00') - new Date(startStr + 'T00:00:00');
                return Math.max(1, Math.round(ms / 86400000) + 1);
            }

            /** 'YYYY-MM-DD'에 n일 더하기 */
            function addDaysYmd(dateStr, n) {
                const d = new Date(dateStr + 'T00:00:00');
                d.setDate(d.getDate() + n);
                return ymd(d.getFullYear(), d.getMonth() + 1, d.getDate());
            }

            /**
             * @param item 가계부 내역(tx) 또는 일정(ev)
             * @param kind 'money' | 'event' — 일정은 고른 날짜를 시작일로, 원래 기간(일수)을 그대로 유지
             */
            async function openCopyModal(item, kind = 'money') {
                const isEvent = kind === 'event';
                const tx = item;
                const sign = tx.type === 'INCOME' ? '+' : '-';
                const spanDays = isEvent ? daysBetweenYmd(item.startDate, item.endDate) : 1;
                const modal = openModal({
                    title: '복사',
                    className: 'ledger-copy-modal',
                    bodyHtml: `<div class="hint">불러오는 중…</div>`,
                });
                const body = modal.el.querySelector('.history-modal-body');

                let targets;
                try {
                    const { data } = await axios.get('/api/shared-calendars');
                    const personal = isEvent
                        ? { key: 'personal', name: '내 캘린더', sub: '개인 일정', url: '/api/schedule' }
                        : { key: 'personal', name: '내 캘린더', sub: '개인 가계부', url: '/api/money/ledger' };
                    const shared = (data || []).map(c => ({
                        key: `shared-${c.id}`, name: c.name, sub: `공유 캘린더 · ${c.memberCount}명`,
                        url: `/api/shared-calendars/${c.id}/${isEvent ? 'schedule' : 'ledger'}`,
                    }));
                    // 지금 보고 있는 캘린더를 맨 위에 (같은 캘린더 안 다른 날짜로 복제할 때)
                    const currentKey = isShared ? `shared-${sharedId}` : 'personal';
                    const all = [personal, ...shared];
                    const current = all.find(t => t.key === currentKey) || (isShared ? null : personal);
                    targets = [
                        ...(current ? [{ ...current, current: true, sub: '지금 캘린더' }] : []),
                        ...all.filter(t => t.key !== currentKey),
                    ];
                } catch (err) {
                    body.innerHTML = `<div class="hint">${esc(err.response?.data?.message || '캘린더 목록을 불러오지 못했어요.')}</div>`;
                    return;
                }
                if (!modal.el.isConnected) return;

                const summary = isEvent ? `
                    <div class="ledger-copy-summary">
                        <span><span class="ledger-event-dot" style="background:${colorTagHex(item.colorTag)}"></span> <b>${esc(item.title)}</b>${item.memo ? ` · ${esc(item.memo)}` : ''}</span>
                        <span class="hint" style="flex:none;">${formatMonthDay(item.startDate)}${spanDays > 1 ? ` ~ ${formatMonthDay(item.endDate)}` : ''}${item.time ? ` ${item.time.slice(0, 5)}` : ''}</span>
                    </div>` : `
                    <div class="ledger-copy-summary">
                        <span>${categoryIcon(tx.category)} <b>${esc(tx.category)}</b>${tx.memo ? ` · ${esc(tx.memo)}` : ''}</span>
                        <b class="${tx.type === 'INCOME' ? 'is-income' : 'is-expense'}">${sign}${won(tx.amount)}</b>
                    </div>`;

                body.innerHTML = `
                    ${summary}
                    <label class="history-search-label" for="copyDate" style="display:block;margin:14px 0 6px;">${isEvent && spanDays > 1 ? '시작일' : '날짜'}</label>
                    <input type="date" id="copyDate" class="history-search-input" value="${isEvent ? item.startDate : tx.date}" style="width:100%;">
                    ${isEvent && spanDays > 1 ? `<p class="history-modal-help" style="margin:6px 0 0;">📅 ${spanDays}일 일정이라, 고른 시작일부터 ${spanDays}일로 복사돼요.</p>` : ''}
                    <div class="history-search-label" style="margin:14px 0 6px;">복사할 캘린더 <span class="hint">(여러 개 선택 가능)</span></div>
                    <ul class="history-category-list">
                        ${targets.map(t => `
                            <li>
                                <label class="history-category-item">
                                    <span><b>${esc(t.name)}</b> <span class="hint${t.current ? ' ledger-copy-current' : ''}">${esc(t.sub)}</span></span>
                                    <input type="checkbox" value="${t.key}">
                                </label>
                            </li>`).join('')}
                    </ul>
                    ${!isEvent && (tx.recurring || tx.recurringOriginId) ? '<p class="history-modal-help" style="margin:10px 0 0;">🔁 반복 항목은 이 날짜에 한 건만 복사돼요.</p>' : ''}
                    <p class="history-custom-error" id="copyError" role="alert" hidden></p>
                    <div class="modal-actions" style="margin-top:16px;">
                        <button type="button" class="btn btn-ghost" data-modal-close>닫기</button>
                        <button type="button" class="btn btn-primary" id="copyDoBtn">복사</button>
                    </div>`;
                body.querySelector('[data-modal-close]').onclick = () => modal.close();
                const errorEl = body.querySelector('#copyError');
                body.querySelectorAll('input').forEach(i => i.addEventListener('change', () => { errorEl.hidden = true; }));

                body.querySelector('#copyDoBtn').onclick = async () => {
                    const date = body.querySelector('#copyDate').value;
                    const picked = [...body.querySelectorAll('input[type=checkbox]:checked')].map(cb => targets.find(t => t.key === cb.value));
                    const fail = (msg) => { errorEl.textContent = msg; errorEl.hidden = false; };
                    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail('날짜를 선택해주세요.');
                    if (picked.length === 0) return fail('복사할 캘린더를 선택해주세요.');

                    const btn = body.querySelector('#copyDoBtn');
                    btn.disabled = true;
                    const payload = isEvent
                        ? { startDate: date, endDate: addDaysYmd(date, spanDays - 1), time: item.time || null,
                            title: item.title, memo: item.memo || '', colorTag: item.colorTag || 'blue' }
                        : { date, type: tx.type, category: tx.category, amount: tx.amount, memo: tx.memo || '', recurring: false };
                    const results = await Promise.allSettled(picked.map(t => axios.post(t.url, payload)));
                    const ok = picked.filter((_, i) => results[i].status === 'fulfilled');
                    const failed = picked.filter((_, i) => results[i].status === 'rejected');

                    // 개인 가계부에 복사했으면 상단 게이지 갱신, 지금 캘린더에 복사했으면 화면 다시 불러오기
                    if (!isEvent && ok.some(t => t.key === 'personal')) initTopbarSalaryTicker();
                    if (ok.some(t => t.current)) await refresh();

                    if (failed.length === 0) {
                        modal.close();
                        const when = isEvent && spanDays > 1 ? `${date} ~ ${addDaysYmd(date, spanDays - 1)}` : date;
                        alert(`${ok.map(t => `'${t.name}'`).join(', ')}에 복사했어요. (${when})`);
                        return;
                    }
                    btn.disabled = false;
                    const reason = results.find(r => r.status === 'rejected')?.reason?.response?.data?.message;
                    fail(`${failed.map(t => t.name).join(', ')}에는 복사하지 못했어요.${reason ? ` (${reason})` : ''}`
                        + (ok.length ? ` ${ok.map(t => t.name).join(', ')}에는 복사됐어요.` : ''));
                    // 이미 복사된 곳은 다시 복사되지 않도록 체크 해제·잠금
                    body.querySelectorAll('input[type=checkbox]').forEach(cb => {
                        if (ok.some(t => t.key === cb.value)) { cb.checked = false; cb.disabled = true; }
                    });
                };
            }

            /* ---------------- 공유 가계부: 꾹 눌러 끌어서 순서 바꾸기 ---------------- */

            /** 바뀐 순서를 서버에 저장 (모든 멤버에게 같은 순서). 실패하면 다시 불러옴 */
            async function saveDayOrder(ids) {
                const date = state.selectedDate;
                // 화면 데이터도 새 순서로 맞춤 (달력 목록 보기 등)
                const byId = new Map((state.byDate[date] || []).map(t => [t.id, t]));
                state.byDate[date] = ids.map(id => byId.get(id)).filter(Boolean);
                try {
                    await axios.put(`${API.ledger}/order`, { date, ids });
                } catch (err) {
                    alert(err.response?.data?.message || '순서를 저장하지 못했어요.');
                    await refresh();
                }
            }

            /**
             * 꾹 누르면(0.4초) 그 항목을 들어 올려 위아래로 끌 수 있게 한다.
             * - 누르기 전에 손가락을 움직이면(스크롤) 취소 → 평소처럼 스크롤됨
             * - 끄는 동안에는 화면이 스크롤되지 않게 막고, 놓으면 onDone(새 id 순서)
             */
            function enableLongPressReorder(ul, onDone) {
                const HOLD_MS = 400;
                const MOVE_TOLERANCE = 8;
                let drag = null;    // { li, pointerId, before }
                let pending = null; // { timer, x, y }

                const idsInDom = () => [...ul.querySelectorAll('li[data-id]')].map(li => Number(li.dataset.id));

                const clearPending = () => {
                    if (pending) clearTimeout(pending.timer);
                    pending = null;
                };

                function startDrag(li, pointerId) {
                    drag = { li, pointerId, before: idsInDom().join(',') };
                    li.classList.add('is-dragging');
                    ul.classList.add('is-reordering');
                    try { li.setPointerCapture(pointerId); } catch { /* 무시 */ }
                    navigator.vibrate?.(25);
                }

                function moveTo(clientY) {
                    const others = [...ul.querySelectorAll('li[data-id]')].filter(el => el !== drag.li);
                    const next = others.find(el => {
                        const r = el.getBoundingClientRect();
                        return clientY < r.top + r.height / 2;
                    });
                    if (next) { if (next.previousElementSibling !== drag.li) ul.insertBefore(drag.li, next); }
                    else if (ul.lastElementChild !== drag.li) ul.appendChild(drag.li);
                    // 화면 끝에 닿으면 조금씩 스크롤
                    if (clientY < 80) window.scrollBy(0, -12);
                    else if (clientY > window.innerHeight - 80) window.scrollBy(0, 12);
                }

                function endDrag(save) {
                    if (!drag) return;
                    const { li, before } = drag;
                    drag = null;
                    li.classList.remove('is-dragging');
                    ul.classList.remove('is-reordering');
                    const after = idsInDom();
                    if (save && after.join(',') !== before) onDone(after);
                    else if (!save) renderDayPanel(); // 취소되면 원래 순서로
                }

                ul.addEventListener('pointerdown', (e) => {
                    if (e.pointerType === 'mouse' && e.button !== 0) return;
                    const li = e.target.closest('li[data-id]');
                    if (!li || e.target.closest('button, a, input, select')) return;
                    clearPending();
                    const pointerId = e.pointerId;
                    pending = { x: e.clientX, y: e.clientY, timer: setTimeout(() => { pending = null; startDrag(li, pointerId); }, HOLD_MS) };
                });
                ul.addEventListener('pointermove', (e) => {
                    if (pending && Math.hypot(e.clientX - pending.x, e.clientY - pending.y) > MOVE_TOLERANCE) clearPending();
                    if (drag && e.pointerId === drag.pointerId) {
                        e.preventDefault();
                        moveTo(e.clientY);
                    }
                });
                ul.addEventListener('pointerup', () => { clearPending(); endDrag(true); });
                ul.addEventListener('pointercancel', () => { clearPending(); endDrag(false); });
                // 끄는 중에는 화면 스크롤 막기 (터치) / 꾹 눌렀을 때 뜨는 메뉴 막기
                ul.addEventListener('touchmove', (e) => { if (drag) e.preventDefault(); }, { passive: false });
                ul.addEventListener('contextmenu', (e) => e.preventDefault());
            }

            function renderDayPanel() {
                $('dayPanelTitle').textContent = state.selectedDate;
                $('daySectionLabel').textContent = isSchedule() ? '등록된 일정' : '등록된 내역';

                if (isSchedule()) {
                    $('dayTotals').innerHTML = '';
                    $('dayTxList').innerHTML = renderEventDayList();
                    $('dayTxList').querySelectorAll('button[data-del-event]').forEach(btn => {
                        btn.onclick = async () => {
                            await axios.delete(`${API.schedule}/${btn.dataset.delEvent}`);
                            if (state.editingEventId === Number(btn.dataset.delEvent)) resetEventForm();
                            await refresh();
                        };
                    });
                    $('dayTxList').querySelectorAll('button[data-edit-event]').forEach(btn => {
                        btn.onclick = () => startEditEvent(Number(btn.dataset.editEvent));
                    });
                    $('dayTxList').querySelectorAll('button[data-copy-event]').forEach(btn => {
                        btn.onclick = () => {
                            const ev = (state.eventsByDate[state.selectedDate] || []).find(e => e.id === Number(btn.dataset.copyEvent));
                            if (ev) openCopyModal(ev, 'event');
                        };
                    });
                    return;
                }

                $('dayTotals').innerHTML = renderDayTotalsHtml(state.selectedDate);
                $('dayTxList').innerHTML = renderDayList();
                const sortableList = $('dayTxList').querySelector('ul.is-sortable');
                if (sortableList) enableLongPressReorder(sortableList, saveDayOrder);
                $('dayTxList').querySelectorAll('button[data-del]').forEach(btn => {
                    btn.onclick = async () => {
                        await axios.delete(`${API.ledger}/${btn.dataset.del}`);
                        if (state.editingId === Number(btn.dataset.del)) resetForm();
                        await refresh();
                        refreshPersonalTicker();
                    };
                });
                $('dayTxList').querySelectorAll('button[data-edit]').forEach(btn => {
                    btn.onclick = () => startEdit(Number(btn.dataset.edit));
                });
                $('dayTxList').querySelectorAll('button[data-copy]').forEach(btn => {
                    btn.onclick = () => {
                        const tx = (state.byDate[state.selectedDate] || []).find(t => t.id === Number(btn.dataset.copy));
                        if (tx) openCopyModal(tx);
                    };
                });
                $('dayTxList').querySelectorAll('button[data-stop]').forEach(btn => {
                    btn.onclick = async () => {
                        if (!confirm('이 항목의 반복을 중지할까요? 이미 생성된 지난 내역은 그대로 유지됩니다.')) return;
                        const tx = (state.byDate[state.selectedDate] || []).find(t => t.id === Number(btn.dataset.stop));
                        if (!tx) return;
                        await axios.put(`${API.ledger}/${tx.id}`, {
                            date: tx.date, type: tx.type, category: tx.category,
                            amount: tx.amount, memo: tx.memo, recurring: false
                        });
                        if (state.editingId === tx.id) resetForm();
                        await refresh();
                        refreshPersonalTicker();
                    };
                });
            }

            function selectDate(dateStr) {
                state.selectedDate = dateStr;
                state.selectedRangeStart = isSchedule() ? dateStr : null;
                state.selectedRangeEnd = isSchedule() ? dateStr : null;
                if (isSchedule()) resetEventForm(); else resetForm();
                setFormOpen(false);
                renderCalendar();
                renderDayPanel();
            }

            /* ---------------- 가계부 폼 ---------------- */

            function resetForm() {
                state.editingId = null;
                state.editingOriginalRecurring = false;
                $('txForm').reset();
                $('txCategory').innerHTML = categoryOptions('EXPENSE');
                $('txCategoryCustom').style.display = 'none';
                $('txCategoryCustom').value = '';
                $('txAmount').value = '';
                $('txSubmitBtn').textContent = '추가';
                $('txCancelBtn').style.display = 'none';
                $('txRecurringLabel').style.display = '';
                $('txRecurring').checked = false;
            }

            function startEdit(id) {
                const tx = (state.byDate[state.selectedDate] || []).find(t => t.id === id);
                if (!tx) return;

                state.editingId = id;
                state.editingOriginalRecurring = !!tx.recurring;

                document.querySelector(`input[name="txType"][value="${tx.type}"]`).checked = true;
                $('txCategory').innerHTML = categoryOptions(tx.type);

                const knownCategory = categoriesForType(tx.type).includes(tx.category);
                if (knownCategory) {
                    $('txCategory').value = tx.category;
                    $('txCategoryCustom').style.display = 'none';
                    $('txCategoryCustom').value = '';
                } else {
                    $('txCategory').value = '__custom__';
                    $('txCategoryCustom').style.display = '';
                    $('txCategoryCustom').value = tx.category;
                }

                $('txAmount').value = Number(tx.amount).toLocaleString('ko-KR');
                $('txMemo').value = tx.memo || '';

                $('txSubmitBtn').textContent = '수정 완료';
                $('txCancelBtn').style.display = '';
                $('txRecurringLabel').style.display = 'none';
                setFormOpen(true);
                $('txAmount').focus();
            }

            function bindMoneyForm() {
                $('txCategory').addEventListener('change', () => {
                    const isCustom = $('txCategory').value === '__custom__';
                    $('txCategoryCustom').style.display = isCustom ? '' : 'none';
                    if (isCustom) $('txCategoryCustom').focus();
                });

                document.querySelectorAll('input[name="txType"]').forEach(radio => {
                    radio.addEventListener('change', () => {
                        const type = document.querySelector('input[name="txType"]:checked').value;
                        $('txCategory').innerHTML = categoryOptions(type);
                        $('txCategoryCustom').style.display = 'none';
                        $('txCategoryCustom').value = '';
                    });
                });

                $('txAmount').addEventListener('input', () => formatAmountInput($('txAmount')));
                $('txCancelBtn').addEventListener('click', () => { resetForm(); setFormOpen(false); });

                $('txForm').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const type = document.querySelector('input[name="txType"]:checked').value;
                    const isCustom = $('txCategory').value === '__custom__';
                    const category = isCustom ? $('txCategoryCustom').value.trim() : $('txCategory').value;
                    const amount = parseAmountInput($('txAmount'));
                    const memo = $('txMemo').value.trim() || null;

                    if (!amount || amount <= 0) return;
                    if (isCustom && !category) {
                        $('txCategoryCustom').focus();
                        return;
                    }

                    const recurring = state.editingId ? state.editingOriginalRecurring : $('txRecurring').checked;
                    const payload = { date: state.selectedDate, type, category, amount, memo, recurring };

                    if (state.editingId) {
                        await axios.put(`${API.ledger}/${state.editingId}`, payload);
                    } else {
                        await axios.post(API.ledger, payload);
                    }

                    resetForm();
                    setFormOpen(false);
                    await refresh();
                    refreshPersonalTicker();
                });
            }

            /* ---------------- 일정 폼 ---------------- */

            function updateColorSwatchSelection(colorKey) {
                $('evtColorPicker').querySelectorAll('.ledger-color-swatch').forEach(sw => {
                    sw.classList.toggle('is-selected', sw.dataset.color === colorKey);
                });
            }

            function resetEventForm() {
                state.editingEventId = null;
                $('eventForm').reset();
                $('evtStartDate').value = state.selectedDate;
                $('evtEndDate').value = state.selectedDate;
                $('evtColorTag').value = 'blue';
                updateColorSwatchSelection('blue');
                $('evtSubmitBtn').textContent = '추가';
                $('evtCancelBtn').style.display = 'none';
            }

            function startEditEvent(id) {
                const ev = (state.eventsByDate[state.selectedDate] || []).find(e => e.id === id);
                if (!ev) return;

                state.editingEventId = id;
                $('evtTitle').value = ev.title;
                $('evtStartDate').value = ev.startDate;
                $('evtEndDate').value = ev.endDate;
                $('evtTime').value = ev.time ? ev.time.slice(0, 5) : '';
                $('evtMemo').value = ev.memo || '';
                $('evtColorTag').value = ev.colorTag || 'blue';
                updateColorSwatchSelection(ev.colorTag || 'blue');

                $('evtSubmitBtn').textContent = '수정 완료';
                $('evtCancelBtn').style.display = '';
                setFormOpen(true);
                $('evtTitle').focus();
            }

            function bindEventForm() {
                $('evtColorPicker').querySelectorAll('.ledger-color-swatch').forEach(sw => {
                    sw.addEventListener('click', () => {
                        $('evtColorTag').value = sw.dataset.color;
                        updateColorSwatchSelection(sw.dataset.color);
                    });
                });

                $('evtCancelBtn').addEventListener('click', () => { resetEventForm(); setFormOpen(false); });

                $('eventForm').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const title = $('evtTitle').value.trim();
                    if (!title) {
                        $('evtTitle').focus();
                        return;
                    }
                    const startDate = $('evtStartDate').value;
                    const endDate = $('evtEndDate').value;
                    if (!startDate || !endDate) return;
                    if (endDate < startDate) {
                        alert('종료일은 시작일보다 빠를 수 없습니다.');
                        $('evtEndDate').focus();
                        return;
                    }
                    const time = $('evtTime').value || null;
                    const memo = $('evtMemo').value.trim() || null;
                    const colorTag = $('evtColorTag').value || 'blue';
                    const payload = { startDate, endDate, time, title, memo, colorTag };

                    if (state.editingEventId) {
                        await axios.put(`${API.schedule}/${state.editingEventId}`, payload);
                    } else {
                        await axios.post(API.schedule, payload);
                    }

                    resetEventForm();
                    setFormOpen(false);
                    await refresh();
                });
            }

            function setFormOpen(open) {
                $('entryFormWrap').style.display = open ? '' : 'none';
                $('formToggleBtnText').textContent = open
                    ? '접기'
                    : `+ ${isSchedule() ? '일정' : '내역'} 추가`;
            }

            function renderFormArea() {
                $('entryFormArea').innerHTML = isSchedule() ? eventFormHtml() : moneyFormHtml();
                if (isSchedule()) {
                    bindEventForm();
                    resetEventForm();
                } else {
                    bindMoneyForm();
                    resetForm();
                }
                setFormOpen(false);
            }

            async function refresh() {
                await Promise.all([loadMonth(), loadEvents()]);
                // 정산 선택 중이면 지금 달에 고른 날짜의 지출을 최신 내역으로 갱신
                const monthPrefix = `${state.year}-${pad2(state.month)}-`;
                state.settle.picked.forEach((_, d) => {
                    if (d.startsWith(monthPrefix)) state.settle.picked.set(d, expensesOn(d));
                });
                if (state.settle.active) updateSettleBar();
                renderMonthSummary();
                renderCalendar();
                renderDayPanel();
            }

            $('prevMonth').addEventListener('click', async () => {
                state.month--;
                if (state.month < 1) { state.month = 12; state.year--; }
                $('monthLabel').textContent = `${state.year}년 ${state.month}월`;
                await refresh();
            });

            $('nextMonth').addEventListener('click', async () => {
                state.month++;
                if (state.month > 12) { state.month = 1; state.year++; }
                $('monthLabel').textContent = `${state.year}년 ${state.month}월`;
                await refresh();
            });

            function updateSwitchActive(groupId, attr, value) {
                $(groupId).querySelectorAll('.ledger-switch-btn').forEach(btn => {
                    btn.classList.toggle('is-active', btn.dataset[attr] === value);
                });
            }

            $('viewSwitch').querySelectorAll('button[data-view]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const next = btn.dataset.view === 'list' ? 'list' : 'calendar';
                    if (state.viewMode === next) return;
                    state.viewMode = next;
                    localStorage.setItem(VIEW_MODE_KEY, state.viewMode);
                    updateSwitchActive('viewSwitch', 'view', next);
                    renderCalendar();
                });
            });

            $('modeSwitch').querySelectorAll('button[data-mode]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const next = btn.dataset.mode === 'schedule' ? 'schedule' : 'money';
                    if (state.mode === next) return;
                    if (state.settle.active && next === 'schedule') {
                        state.settle.active = false;
                        state.settle.picked = new Map();
                        updateSettleBar();
                    }
                    state.mode = next;
                    state.selectedRangeStart = null;
                    state.selectedRangeEnd = null;
                    localStorage.setItem(MODE_KEY, state.mode);
                    updateSwitchActive('modeSwitch', 'mode', next);
                    $('monthSummary').style.display = isSchedule() ? 'none' : '';
                    renderCalendar();
                    renderFormArea();
                    renderDayPanel();
                });
            });

            $('formToggleBtn').addEventListener('click', () => {
                const isOpen = $('entryFormWrap').style.display !== 'none';
                setFormOpen(!isOpen);
            });

            if (isSchedule()) {
                bindEventForm();
                resetEventForm();
            } else {
                bindMoneyForm();
            }

            await refresh();

            if (linkEditId && !isSchedule()) {
                startEdit(linkEditId);
                $('entryFormWrap').scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    };
    return api;
}
